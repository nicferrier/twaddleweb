/*
  twaddle
  
  a very simple in browser twitter client.

  conformance tests - these would be good:
  http://github.com/mzsanford/twitter-text-conformance/blob/master/autolink.yml

  Copyright (C) 2010 by Nic Ferrier - http://twitter.com/nicferrier
*/

/** A very simple jquery based templater.
 */
var template = new Object({
    "exec": function (template_id, template_values) {
        try {
            var template = $(template_id).html().replace(
                    /\@(\w+)/g, 
                function (str, p1, others) {
                    return "%(" + p1 + ")s";
                }
            );
            var html = $.sprintf(template, template_values);
            return html;
        }
        catch (e) {
            ;
        }
    }
});

var twaddle = new Object({
    "contacts": {},

    "tweet_markup": function (text) {
        // Simple twitter text markup function
        return text.replace(
                /[hH][tT][tT][pP](s)*(\S+)/g,
            "<a target='_blank' href='$&'>$&</a>"
        ).replace(
                /@([A-Za-z0-9_]+)/g,
            function (str, p1, others) {
                return "<a class='tweet-url username' target='_blank' href='http://mobile.twitter.com/"  + p1 + "'>@" + p1 + "</a>";
            }
        );
    },

    "twaddler": function (fn, since) {
        // Main function.
        // Calls twitter with jsonp to get the updates.
        // Can pass in 'since' if it's supplied.
        // When the updates arrive formats them as per the #tweettemplate
        // and then pass the resulting HTML to 'fn'
        var urlstr = "http://api.supertweet.net/1/statuses/home_timeline.json?count=200&callback=?";
        if (since) {
            urlstr = "http://api.supertweet.net/1/statuses/home_timeline.json?count=200&since_id=" + since + "&callback=?";
        }

        var x = $.getJSON(
            urlstr,
            function (data, textStatus) {
                $.each(data.reverse(), function(item, tweet) {
                    // Store the contact for later, including how many tweets
                    if (twaddle.contacts[tweet.user.screen_name] == undefined) {
                        tweet.user.tweet_count = 1;
                        twaddle.contacts[tweet.user.screen_name] = tweet.user;
                    }
                    else {
                        twaddle.contacts[tweet.user.screen_name].tweet_count++;
                    }

                    // Pull out the attribs
                    attribs = { 
                        "id": tweet.id,
                        "text": twaddle.tweet_markup(tweet.text),
                        "screen_name": tweet.user.screen_name,
                        "user_url": (tweet.user.url) ? tweet.user.url:"http://mobile.twitter.com/" + tweet.user.screen_name,
                        "user_img": tweet.user.profile_image_url,
                        "name": tweet.user.name,
                        "created_at": tweet.created_at,
                        "reply_class": "hidden"
                    };
                    // FIXME
                    // would like to make proper thread list pulling in all refs to the thread
                    if (tweet.in_reply_to_status_id != undefined
                        && twaddle.contacts[tweet.in_reply_to_screen_name] != undefined) {
                        var id = tweet.in_reply_to_status_id;
                        var screen_name = tweet.in_reply_to_screen_name;
                        attribs["reply_class"] = "";
                        attribs["reply_id"] = id;
                        attribs["reply_html"] = $('#' + id + " span.text").html();
                        var contact = twaddle.contacts[screen_name];
                        if (contact != undefined) {
                            attribs["reply_screen_name"] = screen_name;
                            attribs["reply_name"] = contact.name;
                            attribs["reply_user_url"] = contact.user_url;
                            attribs["reply_user_img"] = contact.profile_image_url;
                            attribs["reply_created_at"] = $('#' + id + " div.date").text();
                            attribs["reply_html"] = $('#' + id + " span.text").html();
                        }
                    }
                    fn(attribs, tweet);
                });
            });
    },

    "reload": function () {
        // Completly initializes the tweet area.
        $("#tweets").empty();
        this.twaddler(function (attribs, tweet) {
            if ($("#" + tweet.id).length == 0) {
                var html = template.exec("#tweettemplate", attribs);
                $("#tweets").prepend(html);
            }
        });
    },
    
    "refresh": function () {
        // Refreshes the tweet area with latest data
        this.twaddler(
            function (attribs, tweet) {  
                if ($("#" + tweet.id).length == 0) {
                    var html = template.exec("#tweettemplate", attribs);
                    $("#tweets").prepend(html);
                }
            },
            $("#tweets li:first")[0].id
        );
    },

    "who": function () {
        $.each(this.contacts, function(user_name, user) {
            var html = template.exec("#whotemplate", {
                "screen_name": user_name,
                "user_img": user.profile_image_url,
                "description": user.description,
                "name": user.name,
                "tweet_count": user.tweet_count
            });
            if ($("#" + user_name).length == 0) {
                $("#who").append(html)
            }
        });
        $("#content").toggleClass("hidden");
        $("#whopanel").toggleClass("hidden");
    },

    "update": function () {
        // Called when your update has been sent to twitter
        try {
            $("input[name='cancel']").trigger("click");
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
