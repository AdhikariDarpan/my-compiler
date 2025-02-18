function updateOutput() {
  const html = document.getElementById("htmlCode").value;
  const css = document.getElementById("cssCode").value;
  const js = document.getElementById("jsCode").value;

  const output = `
    <html>
    <head>
        <style>${css}</style>
    </head>
    <body>
        ${html}
        <script>
          ${js.replace(/<\/script>/g, "<\\/script>")}
        <\/script>
    </body>
    </html>
  `;

  const iframe = document.getElementById("outputFrame");
  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(output);
  iframeDoc.close();
}

const PreHtml = `
<!DOCTYPE html>
<html>
 <head>
 </head>
 <body>
   <h1>Conic Gradient - Three Colors</h1>
   <div id="grad1"></div>
  </body>
</html>`;
const PreCss = `
#grad1 {
    height: 200px;
    width: 200px;
    background-color: red;
    background-image: conic-gradient(red, yellow, green);
}`;
document.getElementById("htmlCode").value = PreHtml;
document.getElementById("cssCode").value = PreCss;
updateOutput();

const tabButtons = document.querySelectorAll(".tab-button");
const codeEditors = document.querySelectorAll(".code-editor");
tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    codeEditors.forEach((editor) => editor.classList.remove("active"));
    button.classList.add("active");
    const tabName = button.getAttribute("data-tab");
    document.getElementById(`${tabName}Code`).classList.add("active");
  });
});
document.querySelectorAll("textarea").forEach((field) => {
  field.addEventListener("input", updateOutput);
});

const converter = document.getElementById("converter");
converter.addEventListener("click", (e) => {
  let popup = document.getElementById("popup");
  popup.style.display = "block";
  document.getElementById("editor").focus();
});
document.addEventListener("click", function (event) {
  let popup = document.getElementById("popup");
  if (!popup.contains(event.target) && event.target !== converter) {
    popup.style.display = "none";
  }
});
document.getElementById("finish").addEventListener("click", function () {
  const htmlContent = document.getElementById("editor").innerHTML;
  popup.style.display = "none";
  document.getElementById("editor").innerHTML = '';
  extractInlineStylesAndScripts(htmlContent);
});
function extractInlineStylesAndScripts(htmlContent) {
  const htmlInput = document.getElementById("htmlCode");
  const cssOutput = document.getElementById("cssCode");
  const jsOutput = document.getElementById("jsCode");
  let parser = new DOMParser();
  let doc = parser.parseFromString(htmlContent.trim(), "text/html");
  let cssContent = "";
  let jsContent = "";
  let elementCount = 1;
  doc.querySelectorAll("[style]").forEach(element => {
      let className = `drp_element_${elementCount}`;
      element.classList.add(className);
      let formattedStyle = element.getAttribute("style")
        .split(";")
        .map(line => line.trim())
        .filter(line => line)
        .map(line => `  ${line};`) 
        .join("\n");
      cssContent += `.${className} {\n${formattedStyle}\n}\n\n`;
      element.removeAttribute("style");
      elementCount++;
  });
  doc.querySelectorAll("[onclick], [onmouseover], [onmouseout], [onchange], [oninput]").forEach(element => {
      let className = `drp_element_${elementCount}`;
      element.classList.add(className);
      Array.from(element.attributes).forEach(attr => {
          if (attr.name.startsWith("on")) {
              let formattedJs = attr.value
                .split(";")
                .map(line => line.trim())
                .filter(line => line)
                .map(line => `  ${line};`) 
                .join("\n");
              jsContent += `document.querySelector('.${className}').${attr.name} = function() {\n${formattedJs}\n};\n\n`;
              element.removeAttribute(attr.name);
          }
      });
      elementCount++;
  });
  function formatHTML(node, indent = 2) {
      let formattedHtml = "";
      node.childNodes.forEach(child => {
          if (child.nodeType === Node.ELEMENT_NODE) {
              let tag = child.outerHTML.split(">")[0] + ">";
              let closingTag = `</${child.tagName.toLowerCase()}>`;
              formattedHtml += " ".repeat(indent) + tag + "\n";
              formattedHtml += formatHTML(child, indent + 2);
              formattedHtml += " ".repeat(indent) + closingTag + "\n";
          } else if (child.nodeType === Node.TEXT_NODE && child.nodeValue.trim()) {
              formattedHtml += " ".repeat(indent) + child.nodeValue.trim() + "\n";
          }
      });
      return formattedHtml;
  }
  let formattedHtml = formatHTML(doc.body, 2);
  let html = `<!DOCTYPE html>\n<html>\n<head>\n</head>\n<body>\n${formattedHtml}</body>\n</html>`;
  htmlInput.value = html;
  cssOutput.value = cssContent.trim();
  jsOutput.value = jsContent.trim();
  updateOutput();
}
function downloadHTML() {
  const html = document.getElementById("htmlCode").value.trim();
  const css = document.getElementById("cssCode").value.trim();
  const js = document.getElementById("jsCode").value.trim();
  let parser = new DOMParser();
  let doc = parser.parseFromString(html, "text/html");
  let bodyContent = doc.body.innerHTML;
  let completeHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated HTML</title>
  <style>
      ${css}
  </style>
</head>
<body>
  ${bodyContent}
  ${js ? `<script>\n${js}\n</script>` : ""}
</body>
</html>`;
  const blob = new Blob([completeHTML], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "drp__template.html";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

document.addEventListener('keydown', function(event) {
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault();
    if (confirm("Do you want to download the file?")) {
      document.getElementById('download').click(); 
    }
  }
});
