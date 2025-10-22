const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

// Lee la plantilla .docx
const content = fs.readFileSync('path_to_your_template.docx', 'binary');

const zip = new PizZip(content);
const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

// Datos que serán inyectados en la plantilla
const data = {
  name: 'Ana Pérez',
  profile: 'Desarrolladora full-stack con 5+ años de experiencia...',
  technologies: {
    methodologies: 'Scrum, Kanban',
    languages: 'JavaScript, Python',
    databases: 'PostgreSQL, MongoDB',
    developmentTools: 'Docker, Git',
    webTechnologies: 'React, Node.js',
    deploymentTools: 'AWS, Heroku',
    testingTools: 'Jest, Mocha'
  },
  experiences: [
    {
      company: 'Acme Corp',
      role: 'Desarrolladora',
      functions: ['Diseñar APIs', 'Desarrollar microservicios'],
      projects: ['Proyecto X', 'Proyecto Y'],
      duration: '2020-2023',
      tools: 'Node.js, Express'
    }
  ],
  academy: {
    technical: {
      title: 'Ingeniera en Sistemas',
      institution: 'Universidad XYZ',
      year: '2019'
    }
  }
};

// Reemplazar los placeholders en la plantilla con los datos
doc.setData(data);

// Renderizar el documento
try {
  doc.render();
} catch (error) {
  console.error(error);
  throw error;
}

// Generar el archivo final en formato DOCX
const buf = doc.getZip().generate({ type: 'nodebuffer' });
fs.writeFileSync('output.docx', buf);
