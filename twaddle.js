/*
 *  twaddle
 *
 *  a very simple in browser twitter client.
 *
 *  conformance tests - these would be good:
 *  http://github.com/mzsanford/twitter-text-conformance/blob/master/autolink.yml
 *
 *  Copyright (C) 2010 by Nic Ferrier - http://twitter.com/nicferrier
*/


/** A very simple jquery based templater.
 * Has a single method 'exec' which takes:
 *
 * @template_name the name of a template
 *  templates are stored as html files congruent with the main html file
 *  NO caching is done - use your webserver to suggest caching
 * @template_values JSON to be interpolated
 * @callback function to call with the templated HTML
 */
function templater() {
    var self = {
        "exec": function (template_name, template_values, callback) {
            try {
                $.ajax({
                    "url": template_name + ".html",
                    "dataType": "html",
                    "success": function (data, text_status, xmlhttprequest) {
                        var template = data.replace(
                                /\@(\w+)/g, 
                            function (str, p1, others) {
                                return "%(" + p1 + ")s";
                            }
                        );
                        var html_data = $.sprintf(template, template_values);
                        callback(html_data);
                    }
                });
            }
            catch (e) {
                ;
            }
        }
    };
    return self;
}


var twaddle = new Object({
    "template": templater(),

    "data": {},
    "contacts": {},

    /** Simple twitter text markup function
     */
    "tweet_markup": function (text) {
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

    /** Main function.
     * Calls twitter with jsonp to get the updates.
     * Can pass in 'since' if it's supplied.
     * When the updates arrive formats them as per the #tweettemplate
     * and then pass the resulting HTML to 'fn'
     */
    "twaddler": function (fn, since) {
        var tweet_count = 200;
        var urlstr = "http://api.supertweet.net/1/statuses/home_timeline.json?count=" + tweet_count + "&callback=?";
        if (since) {
            urlstr = "http://api.supertweet.net/1/statuses/home_timeline.json?count=" + tweet_count + "200&since_id=" + since + "&callback=?";
        }
        
        var x = $.getJSON(
            urlstr,
            function (data, textStatus) {
                twaddle.data = data;
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
                        "twitter_host": "http://api.supertweet.net/1/statuses/update.xml",
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
                        try {
                            // FIXME:
                            // I don't think this is the right way to do this
                            // want to find 1 result and return the result
                            // takewhile?
                            var in_reply_to = $.grep(
                                twaddle.data, 
                                function(e, i) {
                                    var matched = e.id == tweet.in_reply_to_status_id;
                                    return matched;
                                }
                            );
                            if (in_reply_to.length >0) {
                                var id = in_reply_to[0].id;
                                var screen_name = tweet.in_reply_to_screen_name;
                                attribs["reply_class"] = "";
                                attribs["reply_id"] = id;
                                attribs["reply_html"] = twaddle.tweet_markup(in_reply_to[0].text);
                                var contact = twaddle.contacts[screen_name];
                                if (contact != undefined) {
                                    attribs["reply_screen_name"] = screen_name;
                                    attribs["reply_name"] = contact.name;
                                    attribs["reply_user_url"] = contact.user_url;
                                    attribs["reply_user_img"] = contact.profile_image_url;
                                    attribs["reply_created_at"] = in_reply_to[0].created_at;
                                    //attribs["reply_html"] = $('#' + id + " span.text").html();
                                }
                            }
                        }
                        catch (e) {
                            console.log("problem when processing a reply");
                        }
                    }
                    fn(attribs, tweet);
                });
            });
    },

    /** Refresh the whole tweet area with another full download from twitter.
     */
    "reload": function () {
        // Completly initializes the tweet area.
        $("#tweets").empty();
        var template = this.template;
        this.twaddler(function (attribs, tweet) {
            if ($("#" + tweet.id).length == 0) {
                template.exec(
                    "_template_tweet", 
                    attribs,
                    function (html_data) {
                        $("#tweets").prepend(html_data);
                    }
                );
            }
        });
    },

    /** Just poll twitter for the latest.
     */
    "refresh": function () {
        // Refreshes the tweet area with latest data
        this.twaddler(
            function (attribs, tweet) {  
                if ($("#" + tweet.id).length == 0) {
                    twaddle.template.exec(
                        "_template_tweet", 
                        attribs,
                        function (html_data) {
                            $("#tweets").prepend(html_data);
                        }
                    );
                }
            }
            // $("#tweets li:first")[0].id
        );
    },

    /** Present who has tweeted in the current session
     */
    "who": function () {
        var template = this.template;
        $.each(this.contacts, function(user_name, user) {
            var html = template.exec(
                "_template_who", 
                {
                    "screen_name": user_name,
                    "user_img": user.profile_image_url,
                    "description": user.description,
                    "name": user.name,
                    "tweet_count": user.tweet_count
                },
                function (html_data) {
                    if ($("#" + user_name).length == 0) {
                        $("#who").append(html_data)
                    }
                }
            );
        });
        $("#content").toggleClass("hidden");
        $("#whopanel").toggleClass("hidden");
    },

    /** You're updating twitter
     */
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
