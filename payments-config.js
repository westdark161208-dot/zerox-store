// Enlaces públicos de cobro del vendedor. No colocar claves ni contraseñas aquí.
// Activar únicamente enlaces emitidos por la cuenta real de Zero'X Store.
window.ZEROX_PAYMENT_LINKS = Object.freeze({
  PayPal: "",
  Binance: "",
  Transferencia: "",
  Deposito: ""
});

window.ZX_PAYMENT_ICONS=Object.freeze(Object.fromEntries(["card","oxxo","spei","all"].map((key,index)=>[key,["<svg viewBox=\"0 0 48 36\" fill=\"none\"><rect x=\"2\" y=\"3\" width=\"44\" height=\"30\" rx=\"6\" fill=\"#123f57\" stroke=\"#75dcff\" stroke-width=\"2\"/><path d=\"M3 12h42\" stroke=\"#75dcff\" stroke-width=\"5\"/><rect x=\"9\" y=\"22\" width=\"9\" height=\"5\" rx=\"1\" fill=\"#8cf6dc\"/><path d=\"M25 25h12\" stroke=\"#c1f7ff\" stroke-width=\"2\" stroke-linecap=\"round\"/></svg>", "<svg viewBox=\"0 0 64 40\"><rect x=\"1\" y=\"3\" width=\"62\" height=\"34\" rx=\"6\" fill=\"#ffcd42\"/><rect x=\"3\" y=\"6\" width=\"58\" height=\"28\" rx=\"4\" fill=\"#df202b\"/><text x=\"32\" y=\"27\" fill=\"white\" font-family=\"Arial,sans-serif\" font-weight=\"900\" font-style=\"italic\" font-size=\"21\" text-anchor=\"middle\">OXXO</text></svg>", "<svg viewBox=\"0 0 48 40\" fill=\"none\"><path d=\"M4 12L24 3l20 9H4Z\" fill=\"#13584b\" stroke=\"#63ffbc\" stroke-width=\"2\"/><path d=\"M10 16v13m9-13v13m10-13v13m9-13v13M5 33h38\" stroke=\"#9affe0\" stroke-width=\"3\" stroke-linecap=\"round\"/><path d=\"M7 38h34\" stroke=\"#63ffbc\" stroke-width=\"2\" stroke-linecap=\"round\"/></svg>", "<svg viewBox=\"0 0 64 40\" fill=\"none\"><ellipse cx=\"32\" cy=\"20\" rx=\"30\" ry=\"17\" fill=\"#00bcff\"/><path d=\"M5 19l12-9 11 1 10 4 10-3 11 8-11 10-10-1-7 5-12-6-8-1Z\" fill=\"#f6ffff\" stroke=\"#165174\" stroke-width=\"1.5\"/><path d=\"M17 11l9 7 7-4 12 10-5 4-9-7-5 3-6-4m11 1 8 9m-14-7 9 9m-15-9 9 9\" stroke=\"#165174\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>"][index]])));
