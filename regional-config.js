// Public display configuration. Reference rates are inherited estimates, not live FX.
// No production payment method has been verified for this increment.
globalThis.ZXRegionalConfig = Object.freeze({
  countries: Object.freeze([
    {code:'MX', name:'México', flag:'🇲🇽'},
    {code:'US', name:'Estados Unidos', flag:'🇺🇸'},
    {code:'CO', name:'Colombia', flag:'🇨🇴'},
    {code:'AR', name:'Argentina', flag:'🇦🇷'},
    {code:'BR', name:'Brasil', flag:'🇧🇷'}
  ]),
  currencies: Object.freeze([
    {code:'MXN', locale:'es-MX', referenceRate:1},
    {code:'USD', locale:'en-US', referenceRate:0.055},
    {code:'COP', locale:'es-CO', referenceRate:215},
    {code:'ARS', locale:'es-AR', referenceRate:78},
    {code:'BRL', locale:'pt-BR', referenceRate:0.29}
  ]),
  paymentMethods: Object.freeze([])
});
