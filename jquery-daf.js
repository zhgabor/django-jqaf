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
        container: $('body'),
        formSets: '', // only table types are supported
    };

    $.fn.attrs = function() {
        if (arguments.length === 0) {
            if (this.length === 0) {
                return null;
            }

            var obj = {};
            $.each(this[0].attributes, function() {
                if (this.specified) {
                    obj[this.name] = this.value;
                }
            });
            return obj;
        }
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


        var addFS = function(el){
            var holder = el;
            var max = parseInt(el.find('[name*="MAX_NUM_FORMS"]').val());
            var lines = holder.find(instance.options.formSetItem).length;
            if(lines < max){
                var fs = holder.data('item').clone();
                var num = getTotalForms(holder);  // initial id = 0, we calculate by FS items, so we will always have one more no need to increment
                // process all the fields increment numbers
                $('*',fs).each(function(){
                    var elem = $(this);
                    $.map(elem.attrs(), function(val, key){
                        var regex = /-(\d+)-/g;
                        var match = regex.exec(val);
                        if(match){
                            // if attribute like -num- replace the number to the next free
                            elem.attr(key, val.replace('-'+match[1]+'-', '-'+num+'-'));
                        }
                    })
                });
                fs.find('[value]').not('[type="radio"]').val('');
                fs.find('[checked]').removeAttr('checked');
                $(instance.options.formSetItem).last().after(fs);
            }
            if(lines == max-1){
                addButton.hide();
            }
            setTotalForms(holder);
        };

        var getTotalForms = function(holder){
            return parseInt(holder.find('[name*="TOTAL_FORMS"]').val());
        };

        var setTotalForms = function(holder){
            holder.find('[name*="TOTAL_FORMS"]').val($(instance.options.formSetItem).length);
        };

        var addButton = $('<button class="btn btn-default">Add</button>');
        var addNewButton = function(fs){
            addButton.bind('click',function(e){
                e.preventDefault();
                addFS(fs);
            })
            fs.after(addButton);
        }

        var instantiateFormSets = function(){
            if(instance.options.formSets!=''){
                $(instance.options.form_selector+' '+instance.options.formSets).each(function(){
                    var el = $(this);
                    el.data('item', el.find(instance.options.formSetItem).last().clone());
                    addNewButton(el);
                })
            }
        }
        instantiateFormSets();
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
