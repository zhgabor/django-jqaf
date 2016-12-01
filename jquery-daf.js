function getCookie(name) {
    var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    var csrftoken = getCookie('csrftoken');

    function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

$.ajaxSetup({
    beforeSend: function(xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});

function notifyServerError() {
    toastr.error(gettext('Error occurred. Refresh the page and try again.'))
}

;(function ( $, window, document, undefined ) {
    // updated to use server responses of 200,400,500
    // using django backend, use something like the following for error / success messages
    // also made it as a jQuery plugin
    //
    // def form_valid(self, form):
    //     data = {
    //         'message': force_text(_('Product added to cart'))
    //     }
    //     return JsonResponse(data)
    //
    // def form_invalid(self, form):
    //     data = {
    //         'errors': form.errors_as_dict()
    //     }
    //     return JsonResponse(data, status=400)
    var pluginName = 'DjangoAjaxHandler2';
    var defaults = {
        container: $('body')
    };

    function Plugin(element, options) {
        this.options = $.extend( {}, defaults, options) ;
        this._defaults = defaults;
        this.form = element;
        this._name = pluginName;
        this.init();
    }

    Plugin.prototype.init = function () {

        var instance = this;

        var performSubmit = function(e) {
            e.preventDefault();
            remove_errors();
            $(instance.options.submitBtn).button('loading');
            beforeSubmission();
            submit();
        };

        var submit = function() {
            $.ajax({
                url: $(instance.form).attr('action'),
                type: 'post',
                data: new FormData(instance.form),
                cache: false,
                contentType: false,
                processData: false
            })
            .done(function (payload) {
                success(payload);
                if(typeof instance.options.postSuccess == 'function')
                    instance.options.postSuccess(instance, payload);
                else
                    postSuccess(payload);

                if(typeof instance.options.onSuccess == 'function')
                    instance.options.onSuccess(instance.form, payload);
            })
            .fail(function(response) {
                error(response);
            })
        };

        var beforeSubmission = function() {
        };

        var postSuccess = function(payload) {
            if (!payload['redirect_url']) {
                $(instance.options.submitBtn).button('reset').hide('slow');
                $(instance.form).hide('slow')
            }
        };

        var success = function(payload) {
            // Here you can show the user a success message or do whatever you need
            toastr.success(payload['message']);
            if (payload['redirect_url']) {
                setTimeout(function() {window.location.href = payload['redirect_url']}, 1500)
            }
        };

        var resetBtn = function() {
            $(instance.options.submitBtn).button('reset');
        };

        var remove_errors = function(){
            $(instance.form).find('.has-error').each(function (item) {
               $('div.help-block', item).remove();
            }).removeClass('has-error');
        };

        var error = function(response) {
            // we take the JSON of response and further format it for toaster
            var data = response.responseJSON;

            if (response.status==400 && data['errors']) {
                var errors = $.map( data['errors'], function( v, k ) {
                    if(k=='error_message'){
                        // enable below to return enceError: e is not defined
                        // return v;
                    }else{
                        if(k=='__all__')
                            toastr.error(v);
                        else
                        {
                            var field = $(instance.form).find('[name='+k+']');
                            field.parentsUntil('.form-group').parent().addClass('has-error');
                            if(field.parent().next() && field.parent().next().hasClass('help-block')){
                                field.parent().next().text(v);
                            }else{
                                field.parent().after('<div class="help-block">'+v+'</div>');
                            }
                            //return '<strong>' + k + '</strong>: ' + v.replace('.', '');
                        }
                    }
                }).join('<br>');

            }else{
                //probably server 500
                notifyServerError()
            }
            resetBtn();
        };

        var bindEvents = function () {
            instance.options.container.on('click', instance.options.submitBtn, performSubmit);
        };
        bindEvents();
    };

    $[pluginName] = function ( options ) {
        return $(options.form_selector).each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName,
                new Plugin( this, options ));
            }
        });
    }
})( jQuery, window, document );
