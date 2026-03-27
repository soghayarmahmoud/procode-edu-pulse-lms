export class CertificatesComponent {
  async init() {
    this.render();
  }

  render() {
    const app = $('#app');
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
  return new CertificatesComponent();
}
