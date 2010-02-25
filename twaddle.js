/*
  twaddle
  
  a very simple in browser twitter client.

  conformance tests - these would be good:
  http://github.com/mzsanford/twitter-text-conformance/blob/master/autolink.yml

  Copyright (C) 2010 by Nic Ferrier - http://twitter.com/nicferrier
*/

var twaddle = new Object({
    "tweet_markup": function (text) {
        // Simple twitter text markup function
        return text.replace(
                /http(s)*(\S+)/g,
            "<a target='_blank' href='$&'>$&</a>"
        ).replace(
                /@([A-Za-z0-9_]+)/g,
            function (str, p1, others) {
                return "<a class='tweet-url username' target='_blank' href='http://twitter.com/"  + p1 + "'>@" + p1 + "</a>";
            }
        );
    },

    "twaddler": function (fn, since) {
        // Main function.
        // Calls twitter with jsonp to get the updates.
        // Can pass in 'since' if it's supplied.
        // When the updates arrive formats them as per the #tweettemplate
        // and then pass the resulting HTML to 'fn'
        var urlstr = "http://api.twitter.com/1/statuses/home_timeline.json?count=200&callback=?";
        if (since) {
            urlstr = "http://api.twitter.com/1/statuses/home_timeline.json?count=200&since_id=" + since + "&callback=?";
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
                    var html = $.sprintf(template, { 
                        "id": tweet.id,
                        "text": twaddle.tweet_markup(tweet.text),
                        "screen_name": tweet.user.screen_name,
                        "user_url": (tweet.user.url) ? tweet.user.url:"http://twitter.com/" + tweet.user.screen_name,
                        "user_img": tweet.user.profile_image_url,
                        "name": tweet.user.name
                    });
                    fn(html, tweet);
                });
            });
    },

    "reload": function () {
        // Completly initializes the tweet area.
        $("#tweets").empty();
        this.twaddler(function (html, tweet) {
            if ($("#" + tweet.id).length == 0) {
                $("#tweets").append(html);
            }
        });
    },
    
    "refresh": function () {
        // Refreshes the tweet area with latest data
        this.twaddler(
            function (html, tweet) {  
                if ($("#" + tweet.id).length == 0) {
                    $("#tweets li:first").before(html);
                }
            },
            $("#tweets li:first")[0].id
        );
    },

    "update": function () {
        // Called when your update has been sent to twitter
        try {
            $("textarea[name='status']").val("");
            setTimeout(function () { twaddle.refresh();}, 10000);
        }
        catch (e) {
            $("#error").text(e);
        }


    }
});

$(document).ready(function () {
    twaddle.reload();
    // This would be better as a proper listener
    $("#tweetpostsink").load(twaddle.update);
    this.refresh_interval = setInterval(function () { twaddle.refresh();}, 100000);
});

/* end */
