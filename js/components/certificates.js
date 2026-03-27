import { $ } from '../utils/dom.js';

export class CertificatesComponent {
  async init() {
    this.render();
  }

  render() {
    const app = $('#app');
    if (!app) return;
    
    app.innerHTML = `
      <div class="certificates-page">
        <div class="container">
          <h1>Certificates</h1>
          <p>Earn certificates for completing courses</p>
        </div>
      </div>
    `;
  }
}

export function renderCertificates() {
  const certificates = new CertificatesComponent();
  return certificates.init();
}
