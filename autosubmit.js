/* 
	Auto Submit Parent Form on textbox keyup - Used for Ajax - Defined on form field
	<%= text_field_tag ..., :'data-autosubmit-on-keyup' => 'true' %>
*/
$(function() { 
	$('*[data-autosubmit]').bind('keyup', function() {
    	$(this).closest('form').delay(200).submit();
    	return false;
	});
});
