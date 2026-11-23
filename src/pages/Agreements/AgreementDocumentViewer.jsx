// src/pages/Agreements/AgreementDocumentViewer.jsx
// READ-ONLY version of the Telecaller's agreement editor. It renders the saved
// `mergeValues.doc` JSON with the same letterhead, headings, bullets, tables and
// signature boxes the Telecaller sees - so Super Admin verifies the exact same page.
import React, { useEffect, useRef, useState } from 'react';
import { FiPhone, FiGlobe, FiMapPin } from 'react-icons/fi';
import { PAGE_W, PAD_TOP, PAD_SIDE, pageBackground, usePageFlow, PageOverlays } from './pageFlow';
import quotationAdminService from '../../services/quotationAdminService';
import './AgreementDocumentViewer.css';

// mergeValues.doc is stored as a JSON string by the Telecaller form.
export const parseAgreementDoc = (mergeValues) => {
  try {
    const raw = mergeValues && mergeValues.doc;
    if (!raw) return null;
    const d = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return d && Array.isArray(d.blocks) ? d : null;
  } catch {
    return null;
  }
};

const fmtDate = (v) => {
  if (!v) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v));
  return m ? `${m[3]}-${m[2]}-${m[1]}` : String(v);
};

const Text = ({ children, className = '' }) => (
  <div className={`adv-text ${className}`}>{children}</div>
);

const SignBox = ({ title, sign = {} }) => (
  <div className="adv-sign-box">
    <div className="adv-b">{title}</div>
    <div>Signature: ______________</div>
    <div>Name: {sign.name || '______________'}</div>
    <div>Designation: {sign.designation || '______________'}</div>
    <div>Date: {sign.date || '______________'}</div>
  </div>
);

export default function AgreementDocumentViewer({ doc, fallbackHtml = '' }) {
  const [brand, setBrand] = useState(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    let alive = true;
    quotationAdminService
      .getBranding()
      .then((b) => { if (alive) setBrand(b); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const pad = brand?.letterpadDataUrl || '';
  const logo = brand?.hasLogo ? brand.logoDataUrl : '';
  const footerPhone = brand?.phone || '8925811993 / 8925811994';
  const footerWeb = brand?.website || 'www.indocampas.com';
  const footerAddress = (brand?.address || 'TIDEL NEO - Thiruchitrambalam\nKoot Road, Tamil Nadu 605111').split('\n');

  const paged = !!(pad || logo);
  const pages = usePageFlow(bodyRef, paged && !!doc);

  // Old agreements saved before the JSON doc existed: show the saved HTML snapshot.
  if (!doc) {
    return (
      <div className="adv-wrap">
        <div className="adv-page">
          <div className="adv-body" dangerouslySetInnerHTML={{ __html: fallbackHtml || '<p>No document content.</p>' }} />
        </div>
      </div>
    );
  }

  const address = doc.clientAddress || '__________';
  const clientTail = String(doc.clientTail || '').replace(/\{\{address\}\}/g, address);

  const renderBlock = (b, i) => {
    if (b.t === 'h1') return <Text key={i} className="adv-h1">{b.text}</Text>;
    if (b.t === 'h2') return <Text key={i} className="adv-h2">{b.text}</Text>;
    if (b.t === 'p') return <Text key={i} className="adv-p">{b.text}</Text>;
    if (b.t === 'ul') {
      return (
        <React.Fragment key={i}>
          {(b.items || []).map((it, k) => <ul key={k} className="adv-ul adv-ul-item"><li>{it}</li></ul>)}
        </React.Fragment>
      );
    }
    if (b.t === 'table') {
      const rows = b.rows || [];
      return (
        <table key={i} className="adv-table">
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri}>
                {r.map((c, ci) => (
                  <td key={ci} className={(b.head && ri === 0) || ri === rows.length - 1 ? 'adv-b' : ''}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    return null;
  };

  const pageStyle = paged
    ? { width: PAGE_W, height: pages * 1123, padding: 0, minHeight: 0, ...pageBackground(pad) }
    : undefined;

  return (
    <div className="adv-wrap">
      <div className={`adv-page ${paged ? 'adv-paged' : ''}`} style={pageStyle}>
        {paged ? (
          <PageOverlays pages={pages} logo={logo} footerPhone={footerPhone} footerWeb={footerWeb} footerAddress={footerAddress} />
        ) : (
          <div className="adv-head">
            <div className="adv-indo">INDO</div>
            <div className="adv-brand">
              <div className="adv-brand1">CAMPAS TECH</div>
              <div className="adv-brand2">Private Limited</div>
            </div>
          </div>
        )}

        <div className="adv-body" ref={bodyRef} style={paged ? { padding: `${PAD_TOP}px ${PAD_SIDE}px 0` } : undefined}>
          {doc.intro && <Text className="adv-center">{doc.intro}</Text>}
          <div className="adv-p"><b>Agreement Date:</b> {fmtDate(doc.date)}</div>
          <Text className="adv-b">{doc.providerText}</Text>
          <div className="adv-center adv-b"><u>AND</u></div>
          <Text className="adv-b adv-org">{String(doc.clientName || '').toUpperCase()}</Text>
          <Text className="adv-p">{clientTail}</Text>
          <div className="adv-p"><b>Address:</b> {doc.clientAddress || '—'}</div>

          {doc.blocks.map(renderBlock)}

          <Text className="adv-h1">SIGNATURES</Text>
          <Text className="adv-p">IN WITNESS WHEREOF, the parties have executed this Agreement on the date first written above.</Text>
          <div className="adv-signs">
            <SignBox title="For INDOCAMPAS TECH PRIVATE LIMITED" sign={doc.providerSign} />
            <SignBox title={`For ${(doc.clientName || 'THE INSTITUTION').toUpperCase()}`} sign={doc.clientSign} />
          </div>
        </div>

        {!paged && (
          <div className="adv-foot">
            <div><span className="adv-ico"><FiPhone size={12} /></span> {footerPhone}</div>
            <div><span className="adv-ico adv-ico-dark"><FiGlobe size={12} /></span> {footerWeb}</div>
            <div>
              <span className="adv-ico"><FiMapPin size={12} /></span>{' '}
              {footerAddress.map((line, i) => (
                <React.Fragment key={i}>{i > 0 && <br />}{line}</React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}