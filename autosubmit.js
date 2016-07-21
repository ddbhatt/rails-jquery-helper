/* 
	AutoSubmit Parent Form on textbox keyup - Used for Ajax - Defined on form field
	<%= text_field_tag ..., :'data-autosubmit' => 'keyup' %>
	Used for Live Search and Filtering
*/
$(function() { 
	var target = $('*[data-autosubmit]');
	if (target.length > 0) {
		target.each(function(index, objTarget) {
			$(objTarget).bind($(objTarget).data('autosubmit') ,function() {
				$(this).closest('form').delay().submit();
				return false;
			});
			$(objTarget).focus(function (event) {
				$(this).select();	
			});
			$(objTarget).attr("autocomplete","off");
		});
	}
});
