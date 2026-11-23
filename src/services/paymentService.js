const API_BASE=import.meta.env.VITE_API_BASE||'/api';
const auth=()=>{const t=localStorage.getItem('token');return t?{Authorization:`Bearer ${t}`}:{}};
const err=async r=>{try{const d=await r.json();return d?.message||d?.error||`Request failed (${r.status})`}catch{return `Request failed (${r.status})`}};
const request=async(path,options={})=>{const r=await fetch(`${API_BASE}${path}`,{...options,headers:{...auth(),...(options.headers||{})}});if(!r.ok)throw new Error(await err(r));return r.status===204?null:r.json()};
const upload=(path,file)=>{if(!file)return Promise.reject(new Error('Please select an image first.'));const f=new FormData();f.append('file',file);return request(path,{method:'POST',body:f})};
export const paymentService={uploadQr:file=>upload('/payments/admin/qr',file),uploadInvoiceLogo:file=>upload('/payments/admin/invoice-assets/logo',file),uploadInvoiceSignature:file=>upload('/payments/admin/invoice-assets/signature',file),uploadThankYouImage:file=>upload('/payments/admin/invoice-assets/thank-you',file),getInvoiceBrandAssets:()=>request('/payments/invoice-assets/data'),getQrData:()=>request('/payments/qr/data')};
export default paymentService;
