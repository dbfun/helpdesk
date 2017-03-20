(function ($) {

  var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
  };

  var ExecutorId = getUrlParameter('ExecutorId');

  $(document).ready(function(){
    var $userName = $('.js-username'),
        $userPhoto = $('.js-userphoto'),
        $usersList = $('.js-userslist'),
        userListInitialized = false
        ;
    initCalendar();
    loadPage(ExecutorId);

    $('body').on('click', '.js-changeuser', function(e){
      loadPage($(this).attr('data-id'));
    });


    function loadPage(ExecutorId) {
      $.ajax({
        url: "report.json",
        method: 'GET',
        data: {
          ExecutorId: ExecutorId
        },
        cache: false,
        dataType: 'json',
        error: function(){
          $('#calendar').html('Упс, данные для отчета не получены');
        },
        success: function(resp) {
          var curUser = resp.users[ExecutorId];

          $userName.html(curUser.Name)
          $userPhoto.attr('src', curUser.photo);

          initUserList(resp);



          // var $tasksList = $('.js-tasks-list');

          $('#calendar').fullCalendar('removeEvents');

          for(var i in resp.tasks) {
            var task = resp.tasks[i];

            // $tasksList.append("<div class='fc-event' style='margin-bottom:5px; padding: 5px; font-size:14px;'>[" + task.Id + '] ' +task.Name + "</div>");

            if(typeof task.Expenses !== 'undefined' && task.Expenses.length) {

              for(var i2 in task.Expenses) {
                var expense = task.Expenses[i2];
                if(expense.UserId != ExecutorId) continue;

                var expHours = Math.round(expense.Minutes / 6) / 10;
                var event = {
                  title: task.Name,
                  start: expense.Date.substr(0,10),
                  className: 'task-status--' + task.StatusId,
                  data: {
                    url: 'http://helpdesk/Task/View/' + task.Id,
                    expHours: expHours
                  }
                };

                $('#calendar').fullCalendar('renderEvent', event);
              }
            }

          }
          // console.log(events);
          //

          console.log($('#calendar').fullCalendar( 'clientEvents'));
          $('#calendar').fullCalendar('render');

          // $('#calendar').fullCalendar( 'renderEvent', {title: 'test', start: '2017-02-01'} );

          /*
          $('#external-events .js-tasks-list .fc-event').each(function() {
            // store data so the calendar knows to render an event upon drop
            $(this).data('event', {
              title: $.trim($(this).text()), // use the element's text as the event title
              stick: true // maintain when user navigates (see docs on the renderEvent method)
            });

            // make the event draggable using jQuery UI

            $(this).draggable({
              zIndex: 999,
              revert: true,      // will cause the event to go back to its
              revertDuration: 0  //  original position after the drag
            });
          });*/

        }
      });
    }

    function initCalendar() {
      $('#calendar').fullCalendar({
        header: {
          left: 'prev,next today',
          center: 'title',
          right: 'month,agendaWeek,agendaDay'
        },
        firstDay: 1,
        hiddenDays: [ 0, 6 ],
        dayNames: ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота' ],
        dayNamesShort: ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'суб' ],
        monthNames: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
        locale: 'ru',
        editable: false,
        droppable: true, // this allows things to be dropped onto the calendar
        drop: function(date, jsEvent, ui ) {
          // is the "remove after drop" checkbox checked?
          if ($('#drop-remove').is(':checked')) {
            // if so, remove the element from the "Draggable Events" list
            $(this).remove();
          }
        },
        eventRender: function(event, element) {
          element.html('<span class="task-hours">' + event.data.expHours +'</span>' + event.title);
        }
      });
    }


    function initUserList(resp) {
      if(userListInitialized) return;
      userListInitialized = true;
      var keys = Object.keys(resp.users).sort(function(a,b){return resp.users[a].Name > resp.users[b].Name ? 1: -1});

      keys.forEach(function(i){
        var user = resp.users[i];
        $usersList.append('<li class="js-changeuser online" data-id="' + user.Id + '"><img src="' + user.photo + '" alt="">'
            +'<div class="name"><h5><b>' + user.Name + '</b></h5></div></li>');
      });
    }





  });



})(jQuery);