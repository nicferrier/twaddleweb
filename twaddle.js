/*
  twaddle
  
  a simple twitter client.

 */

function twaddle() {
    $("#tweets").empty();
    $.getJSON(
        "http://api.twitter.com/1/statuses/home_timeline.json?count=200&callback=?",
        function (data) {
            $.each(data, function(item, tweet) {
                var template = $("#tweettemplate").html().replace(
                        /\@(\w+)/g, function (str, p1, others) {
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
                $("#tweets").append(h);
            });
        });
}

$(document).ready(function () {
    twaddle();
});

/* end */
