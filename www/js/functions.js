/*
  By: some guy on the interner
  used by: Cena Abachi
  gmail: devloger.io@gmail.com
  whatsapp: +98 9128573237
  last update: 5/11/2019
*/

// this will recieve the parameter that is on the query string
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}