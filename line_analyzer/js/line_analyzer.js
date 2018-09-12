(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-92786015-5', 'auto');
ga('send', 'pageview');

var reader, lines, friendName;
            
var selected = 0;

function dateChecker(date1, date2) {
    if (date1 > date2) {
        alert("Start Date Can not exceed End Date");
        return false;
    }

    return true;
}

function checkFileAPI() {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        reader = new FileReader();
        return true;
    } else {
        alert('The File APIs are not fully supported by your browser.');
        return false;
    }
}

function checkFile(filePath) {
    var fname = filePath.files[0].name;

    if (filePath.files[0].type.includes("text/plain") && "txt" == fname.slice((fname.lastIndexOf(".") - 1 >>> 0) + 2)) {
        return true;
    } else {
        alert('Not a txt file.');
        return false;
    }
}

function chartRender(startDate, data) {

    var dps = [];

    var theDate = new Date(startDate);

    for (var i = 0; i < data.length; i++){
        dps.push({x: new Date(theDate), y: data[i]});
        theDate.setDate(theDate.getDate() + 1);
    }

    // chart config
    var chart = new CanvasJS.Chart("chartContainer", {
        zoomEnabled: true,
        animationEnabled: true,
        animationDuration: 3500,
        exportFileName: "Line_Chat_Analysis_" + friendName,
        exportEnabled: true,
        title: {
            text: "Line Chat Analysis - " + friendName
        },
        axisX: {
            valueFormatString: "YY-MM-DD"
        },
        data: [{
            type: "column",
            dataPoints: dps,
            color: "#888",
            click: function(e){
                //alert(  e.dataSeries.type+ ", dataPoint { x:" + e.dataPointIndex.x + ", y: "+ e.dataPointIndex.y + " }" );
            },
        }]
    });
    chart.render();

}

function counting(startDate, endDate , lines, msg, sticker, photo, size) {
    var checkDate = new Date(startDate);
    checkDate.setDate(checkDate.getDate()-1);

    var readDate = -1;

    for(var i = 3; i < lines.length; i++) {
        
        //match date TODO match name
        if(lines[i].match(/^\d{4}\/\d{2}\/\d{2}/)) {
            
            var nowDate = new Date(lines[i].substr(0,10));
            
            var j = Math.ceil((nowDate-checkDate) / (1000 * 3600 * 24));

            readDate = readDate + j;
            checkDate.setDate(checkDate.getDate()+j);
        } else
        
        //match date TODO match name
        if(lines[i].match(/,\s\d{2}\/\d{2}\/\d{4}/)) {

            var nowDate = new Date(lines[i].substr(5,10));
            
            var j = Math.ceil((nowDate-checkDate) / (1000 * 3600 * 24));

            readDate = readDate + j;
            checkDate.setDate(checkDate.getDate()+j);
        }
        
        if(readDate >= size){
            return;
        }

        //match time
        if (lines[i].match(/^([1]?[0-9]|2[0-4])(:[0-5][0-9])/)) {
            msg[readDate]++;
            
            if(lines[i].match("[Sticker]") || lines[i].match("[貼圖]")){
                sticker[readDate]++;
            } else if(lines[i].match("[Photo]") || lines[i].match("[照片]")){
                photo[readDate]++;
            }
        }
    }
}

function analysis(startDate, endDate, lines) {

    var date1 = new Date(startDate);
    var date2 = new Date(endDate);

    if (!dateChecker(date1, date2)){
        return 0;
    }

    var size = Math.ceil((date2-date1) / (1000 * 3600 * 24))+1;

    var msg = new Array(size);
    var sticker = new Array(size);
    var text = new Array(size);
    var photo = new Array(size);
    for(var i = 0; i < msg.length; i++){
        msg[i] = 0;
        sticker[i] = 0;
        text[i] = 0;
        photo[i] = 0;
    }

    counting(date1, date2, lines, msg, sticker, photo, size);
    
    var mode = $( "input:checked" ).val();
    
    switch (mode){
        case "1":
            chartRender(date1, msg);
            break;
        case "2":
            chartRender(date1, sticker);
            break;
        case "3":
            chartRender(date1, photo);
            break;
        case "9":
            var text = new Array;
            for(var i = 0; i < size; i++){
                text[i] = msg[i] - sticker[i] - photo[i];
            }
            chartRender(date1, text);
            
            break;
    }
}

function main(filePath) {

    if(checkFileAPI() && filePath.files && filePath.files[0] && checkFile(filePath)) {

        reader.onload = function(e) {

            $.blockUI({ message: '<div>Loading...</div>' });

            text = e.target.result;

            lines = text.split(/\n+/g);

            try{
                // ios English
                if (lines[0].match(" Chat history with ")) {
                    friendName = lines[0].substr(25);
                    endDate = new Date(lines[1].substr(9,11));
                    startDate = new Date(lines[3].substr(5,10));

                // android English
                } else if (lines[0].match("Chat history with ")){
                    friendName = lines[0].substr(18);
                    endDate = new Date(lines[1].substr(9,11));
                    startDate = new Date(lines[3].substr(0,10));

                // Chinese version
                } else if (lines[0].match("[LINE]") && lines[0].match("的聊天記錄")) {
                    friendName = lines[0].substr(8).replace("的聊天記錄","");
                    endDate = new Date(lines[1].substr(5,11));
                    startDate = new Date(lines[3].substr(0,10));

                } else {
                    $.unblockUI();
                    alert("Format error!");
                    return;
                }
            } catch (err){
                $.unblockUI();
                alert("Format error!");
                return;
            }
            
            $('#startDate').datetimepicker('update' ,startDate);
            $('#endDate').datetimepicker('update' ,endDate);

            $('.form_date').datetimepicker("setStartDate", startDate);
            $('.form_date').datetimepicker('setEndDate', endDate);

            analysis($('#startDate').val(), $('#endDate').val(), lines);

            $.unblockUI();

            $('html, body').animate({
                scrollTop: $( '#result' ).offset().top
            }, 1000);
        };

        reader.readAsText(filePath.files[0]);
    }
}

function setLink(link) {
    $('#filelink').val(link.value);
    selected = 1;
    main(link);
}