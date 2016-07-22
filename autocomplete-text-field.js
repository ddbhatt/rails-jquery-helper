/*
	AutoComplete TextBox
D	data-autocomplete = 'url for data for autocomplete'
D   Required data-autocomplete-field-display = 'field,field, fields that show up in dropdown display' 
D	Optional data-autocomplete-field-id = 'field that is stored in id hidden field default id'
D	Optional data-autocomplete-hidden-field = 'name of the hidden field that stores id'
W   Optional data-autocomplete-field-store = 'field,field, fields that show up in dropdown display default same as field-display' 
W	data-autocomplete-noMatchesLabel' => 'no brands found'
W	data-autocomplete-showNoMatches' => false


Usage:
<%= text_field_tag :contact, params[:find], 
        :'data-autocomplete' => contacts_path(format: :json),
        :'data-autocomplete-field-display' => 'full_name', 
        :placeholder => 'Name of Person', 
        class: "form-control", :autocomplete => "off" %>

In Model:
    def self.autocomplete(query)
        where("full_name like ? or nickname like ?", "#{query}%", "#{query}%")
    end

In Controller:
    For Extra Fields for JSON
    def index
        if ! params[:autocomplete].blank?
            @autocomplete = Person.autocomplete(params[:autocomplete]) # autocomplete is staring with
        else
            @autocomplete = Person.search(params[:search]) # Search is anywhere
        end 

        @autocomplete.sort! { |a,b| a.name <=> b.name } # Sort Alphabetically
        
        respond_to do |format|
            format.html # For Page
            format.js # For Live Filter
            format.json {render :json => @autocomplete.to_json(:methods => [:name]) } # For AutoComplete
        end
    end 
*/
$(function() {
    var objAutocomplete = $('input[data-autocomplete]');

    if (objAutocomplete.length > 0) {
        objAutocomplete.each(function(index, objTarget) {
    	    var target_id_str = $(objTarget).attr("id");

            // Required DataSource for AutoComplete
            // WIP: if source in array format parse it and set it as source
		    var datasource = $(objTarget).data('autocomplete');

            // Handle Optional Fields ID
    		var field_id = $(objTarget).data('autocomplete-field-id');
            if (field_id == null || field_id.length == 0) {
                field_id = 'id'; 
            }

            // Fields to Display Make Array
    		var fields_display = $(objTarget).data('autocomplete-field-display').split(',');
    		for (var i = fields_display.length - 1; i >= 0; i--) {
    			fields_display[i] = fields_display[i].trim()
    		}

            // Boolean to Search - Used for Backspace 
            // WIP: Enter should move to next element
            var performSearch = true;

            // Add Hidden Field to store ID
            hidden_field = $(objTarget).data('autocomplete-hidden-field');
            if (hidden_field != null && hidden_field.length > 0) {
                $('<input type="hidden" name="' + hidden_field  + '" id="' + hidden_field + '">').insertAfter($(objTarget))    
            } else {
                $('<input type="hidden" name="' + target_id_str  + '_id" id="' + target_id_str + '_id">').insertAfter($(objTarget))
            }
            
            $(objTarget).attr("autocomplete","off");
            // Below is the textfield that will be autocomplete    
            $(objTarget).autocomplete({
                delay: 300,
                minLength: 1,
                // This updates the textfield when you move the updown the suggestions list, with your keyboard. 
                // In our case it will reflect the same value that you see in the suggestions which is the person.given_name.
                source: function( request, response ) {
                    if (performSearch) { 
                        $.ajax({
                            type: "get",
                            url: datasource,
                            dataType: "json",
                            data: {
                                autocomplete: request.term
                            },
                            success: function( data ) {
                                response( data.length === 1 && data[ 0 ].length === 0 ? [] : data );
                            }
                        });
                    }
                },
                autoFocus: true,
                // Once a value in the drop down list is selected, do the following:
                select: function(event, ui) {
                    // place the value into the textfield
                    var strDisplay = '';
                    for (var i = 0; i <= fields_display.length - 1; i++) {
                    	var strValue = null;
                    	try	{
                    		strValue = ui.item[fields_display[i]];
                    	} catch(err) {
                    		strValue = null;
                    	}
                    	if (strValue != null && strValue != "") {
                    		strDisplay += ' ' + strValue
                    	}
                    }
                    strDisplay = strDisplay.trim();
                    $(event.target).val(strDisplay);
                    $(event.target).select();

                    // and place the id into the hidden textfield 
                    hidden_field = $(event.target).data('autocomplete-hidden-field');
                    if (hidden_field != null && hidden_field.length > 0) {
                        $('#' + hidden_field).val(ui.item[field_id]);
                    } else {
                        $('#' + $(event.target).attr("id") + '_id').val(ui.item[field_id]);
                    }


                    return false;
                    event.preventDefault();
                },
                change: function(event, ui) {
                	// Check if in List else clear value
                    if ( !ui.item ) {
                        $(event.target).val("");
                    }
                },
                // Select first suggestion and highlight remainder 
                open: function( event, ui ) {
                    var firstElement = $(event.target).autocomplete("widget").children().first()
                    var original = $(event.target).val()
                    var firstElementText = $(firstElement).text();
                    /*
                       here we want to make sure that we're not matching something that doesn't start
                       with what was typed in 
                    */
                    if(firstElementText.toLowerCase().indexOf(original.toLowerCase()) === 0){
                        $(event.target).val(firstElementText);//change the input to the first match

                        $(event.target)[0].selectionStart = original.length; //highlight from end of input
                        $(event.target)[0].selectionEnd = firstElementText.length;//highlight to the end
                    }
                    if(original === $(event.target).val()) {
                        $(event.target)[0].selectionStart = 0;
                        $(event.target)[0].selectionEnd = original.length;
                    }
                    event.preventDefault;
                }
            }).focus(function (event) {
                $(event.target).autocomplete("search");
            }).keydown(function (event) {
                if (event.keyCode == 8 || event.keyCode == 13) {
                    performSearch = false; //do not perform the search
                } else {
                    performSearch = true; //perform the search
                }
                if (event.keyCode == 13) {
                    // Focus on the Next field
                    next_field = $(event.target).next();
                    if ($(next_field).attr('type') == 'hidden' && $(next_field).next().length > 0) {
                        $(next_field).next().focus();
                    } else {
                        if ($(next_field).next().length > 0) {
                            $(next_field).focus();                  
                        } else{
                            // Last Field Remove Focus
                            $(event.target).blur();
                        }
                    }
                    event.preventDefault();
                }
            })

            // The below code is straight from the jQuery example. 
            // It formats what data is displayed in the dropdown box, and can be customized.
            $(objTarget).autocomplete( "instance" )._renderItem = function( ul, item ) {
                var strDisplay = '';
                for (var i = 0; i <= fields_display.length - 1; i++) {
                	var strValue = null;
                	try	{
                		strValue = item[fields_display[i]];
                	} catch(err) {
                		strValue = null;
                	}
                	if (strValue != null) {
                		strDisplay += ' ' + strValue
                	}
                }
                strDisplay = strDisplay.trim();
                if (strDisplay != "") {
	                return $( "<li>" )
	                    .data( "ui-autocomplete-item", item )
	                    // For now which just want to show the person.given_name in the list.
	                    .append( "<a>" + strDisplay + "</a>" )
	                    .appendTo( ul );
	            }
	            return false;
            };
            // Set menu width to same as textbox size
            $(objTarget).autocomplete("instance")._resizeMenu = function() {
                this.menu.element.outerWidth(this.element.outerWidth());
            };
        });
    }
});
