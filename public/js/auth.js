// var client_id = "0b08eb54c8ad438da58155250f19d42d";
// var redirect_uri = "http://localhost:8888/callback";

// var app = express();

// app.get("/login", function (req, res) {
//   var state = generateRandomString(16);
//   var scope = "user-read-private user-read-email";

//   res.redirect(
//     "https://accounts.spotify.com/authorize?" +
//       querystring.stringify({
//         response_type: "code",
//         client_id: client_id,
//         scope: scope,
//         redirect_uri: redirect_uri,
//         state: state,
//       }),
//   );
// });
