# jquery daf (django ajax forms)
jQuery plugin making django forms submit through ajax, easily overridable settings

Using csrf token from cookie

## Installation

* Download [jquery-daf.js](https://github.com/zhgabor/jquery-daf/blob/master/jquery-daf.js) to `/static/js` directory
* Include it in your html
* Bind and Initialize the plugin, check demo

## Dependencies

* [jQuery](http://jquery.com/download/)
* [toastr](https://github.com/CodeSeven/toastr)
* Django [gettext javascript](https://docs.djangoproject.com/en/1.10/topics/i18n/translation/#using-the-javascript-translation-catalog)
* Bootstrap [JS Button](http://getbootstrap.com/javascript/#buttons)


```javascript
var defaults = {
    container: $('body'),
    
    formSets: '', 
    // specify form element placeoholder of the formset, we cannot have more form tags inside a form so replace it
    
    formSetItem: 'tbody tr', 
    // formset table row selector, only used when formSets is specified
    
    captchaField: '#div_id_captcha', 
    // the holder for the google captcha ... used for error message
    
    removeErrors: function(form, instance){ 
    // error remover before submit
        $(form).find('.has-error').each(function (item) {
           $('div.help-block', item).remove();
        }).removeClass('has-error');
    },
    
    beforeSubmission: function(form, instance){ 
    // after errors are cleared, preprocessing can be done here
        $(instance.options.submitBtn).button('loading');
    },
    
    onSuccess: function(form, response){
    // response from server is 200
        toastr.success(response['message']);
        if (response['redirect_url']) {
            setTimeout(function() {window.location.href = response['redirect_url']}, 1500)
        }
    },
    
    postSuccess: function(form, response, instance) { 
    // this happens after success post processing can be done here
        $(instance.options.submitBtn).button('reset').hide('slow');
        $(form).hide('slow')
    }
};
```
