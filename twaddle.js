/*
  twaddle
  
  a simple twitter client.

 */
var twaddle = new Object({
    "twaddler": function (fn, since) {
        /**
           Main function.
           Calls twitter with jsonp to get the updates.
           Can pass in 'since' if it's supplied.
           When the updates arrive formats them as per the #tweettemplate
           and then pass the resulting HTML to 'fn'
         */
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

    "refresh": function () {
        /**
           Completly initializes the tweet area.
         */
        $("#tweets").empty();
        this.twaddler(function (h) {
            $("#tweets").append(h);
        });
    },
    
    "update": function () {
        /**
           Updates the tweet area.
           FIXME::: currently broken
         */
        this.twaddler(
            function (h) {  $("#tweets").before(h);},
            $("#tweets")[0].id
        );
    }
});

$(document).ready(function () {
    twaddle.refresh();
    //setInterval("twaddle.update();", 5000);
});

/* end */
