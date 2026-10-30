# Kilovia: site de vendas do gerador de propostas (ES / CA / PT)

## Páginas
- `/` (`index.html`): página de credibilidade. Um único call to action abre um formulário curto com 4 dados (nome, empresa, e-mail, WhatsApp).
- `/enviar` (`enviar.html`): formulário completo com os anexos (proposta, Excel, logo). É a página que você manda para o lead depois.
  - Link personalizado, que já chega preenchido: `/enviar?lang=es&n=Nome&e=Empresa&m=email@x.com&t=+34600000000`
  - Quando alguém preenche o formulário curto, o e-mail que você recebe já traz esse link pronto para encaminhar.

## Arquivos
- `assets/i18n.js`: todos os textos nos 3 idiomas e a detecção de idioma. Preços, prazos e o nome da marca se trocam aqui.
- `assets/styles.css`: identidade visual (azul-noite #0B1B2B, azul #1E4FD8, laranja #FF7A1A, fundo #F5F7FA).
- `assets/site.js`: animações, parallax, contadores e o formulário curto. `assets/enviar.js`: envio dos arquivos.
- `api/lead.js`: avisa você por e-mail quando alguém preenche o formulário curto.
- `api/enviar.js`: te manda por e-mail os dados e os arquivos anexados.
- `api/upload.js`: autoriza o envio dos arquivos para o Vercel Blob (até 20 MB cada). `api/geo.js`: localização do visitante.

## Como o idioma é escolhido
1. O que a pessoa escolheu no seletor ES / CA / PT, ou `?lang=` no link.
2. Navegador em catalão → catalão.
3. Localização: Catalunha ou Andorra → catalão; resto da Espanha → espanhol; Brasil ou Portugal → português.
4. Idioma do navegador; o padrão é espanhol.

## Publicar na Vercel
1. Suba esta pasta para um repositório no GitHub e importe na Vercel (sem framework, sem build).
2. Storage → Create → Blob → conectar ao projeto (cria `BLOB_READ_WRITE_TOKEN`).
3. Crie a conta no Resend e gere uma API key.
4. Environment Variables:
   - `RESEND_API_KEY`
   - `DESTINO_EMAIL`: onde você recebe os contatos e as propostas
   - `SITE_URL`: ex. `https://kilovia.es` (para o link personalizado)
   - `REMITENTE` (opcional): ex. `Kilovia <hola@kilovia.es>`, depois de verificar o domínio no Resend
5. Deploy, depois teste os dois formulários com um PDF e um Excel.

## Antes de divulgar
- Confirme o nome da marca e o domínio. Se mudar de "Kilovia", troque em `i18n.js` e no logo dos dois HTML.
- Confirme preços (490 € / R$ 997) e prazos em `i18n.js`.
- Coloque o vídeo (instrução no comentário do `index.html`).
- Crie `/privacidad` e um aviso legal (RGPD e LSSI, obrigatórios na Espanha).
- Os arquivos ficam no Vercel Blob com endereço impossível de adivinhar, mas acessível a quem tiver o link. Apague-os ao terminar cada projeto.
