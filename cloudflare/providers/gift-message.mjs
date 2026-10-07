export const DEFAULT_GIFT_MESSAGE='Gracias por su preferencia. https://zeroxstore.com';
export const validGiftMessage=v=>typeof v==='string'&&v.trim().length>0&&v.trim().length<=100&&!/[\u0000-\u001f]/.test(v);
export const giftMessage=settings=>validGiftMessage(settings?.giftMessage)?settings.giftMessage.trim():DEFAULT_GIFT_MESSAGE;
