const React=require('react');const S=require('react-dom/server');const sharp=require('sharp');
const {LuGhost}=require('react-icons/lu');
const svg=S.renderToStaticMarkup(React.createElement(LuGhost,{color:'#8ED6CC',size:512}));
sharp(Buffer.from(svg)).resize(512,512).png().toFile(process.argv[2]).then(()=>console.log('ok'));
