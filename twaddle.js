/*
  twaddle
  
  a simple twitter client.


  ---------------------------------
  Copyright (C) 2010 by Nic Ferrier
 */
var twaddle = new Object({
    "twaddler": function (fn, since) {
        // Main function.
        // Calls twitter with jsonp to get the updates.
        // Can pass in 'since' if it's supplied.
        // When the updates arrive formats them as per the #tweettemplate
        // and then pass the resulting HTML to 'fn'
        var urlstr = "http://api.twitter.com/1/statuses/home_timeline.json?count=200&callback=?";
        if (since) {
            urlstr = "http://api.twitter.com/1/statuses/home_timeline.json?count=200&since_id" + since + "&callback=?";
            }
        $.getJSON(
            urlstr,
            function (data) {
                $.each(data, function(item, tweet) {
                    var template = $("#tweettemplate").html().replace(
                            /\@(\w+)/g, 
                        function (str, p1, others) {
                            return "%(" + p1 + ")s";
                        }
                    );
                    var h = $.sprintf(template, { 
                        "id": tweet.id,
                        "text": tweet.text.replace(/http(s)*(\S+)/, "<a target='_blank' href='$&'>$&</a>"),
                        "screen_name": tweet.user.screen_name,
                        "user_url": (tweet.user.url) ? tweet.user.url:"http://twitter.com/" + tweet.user.screen_name,
                        "user_img": tweet.user.profile_image_url,
                        "name": tweet.user.name
                    });
                    fn(h);
                });
            });
    },

    "reload": function () {
        // Completly initializes the tweet area.
        $("#tweets").empty();
        this.twaddler(function (h) {
            $("#tweets").append(h);
        });
    },
    
    "refresh": function () {
        // Refreshes the tweet area with latest data
        // FIXME::: currently broken
        this.twaddler(
            function (h) {  $("#tweets").before(h);},
            $("#tweets")[0].id
        );
    },

    "update": function () {
        // Sends your update to twitter.
        alert("updated!");
        /*$.post(
            "http://api.twitter.com/1/statuses/update.json?callback=?", 
            $("#update").serialize(),
            function (data, textStatus, request) {
                alert("tweeted!!");
            }
        );*/
    }
});

$(document).ready(function () {
    twaddle.reload();
    $("#tweetpostsink").load(function () {
        $("textarea[name='status']").val("");
    });
    //setInterval("twaddle.refresh();", 5000);
});

/* end */
