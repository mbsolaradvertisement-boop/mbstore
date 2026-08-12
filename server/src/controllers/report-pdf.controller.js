const PDFDocument = require("pdfkit");
const { buildSellerReport } = require("./report.controller");

const teal = "#0f766e", dark = "#0f172a", muted = "#64748b", line = "#e2e8f0";
const palette = ["#0f766e", "#14b8a6", "#5eead4", "#6366f1", "#38bdf8", "#f59e0b", "#f472b6", "#94a3b8"];
const dateText = (value) => new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
const generatedText = (value) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value));

function heading(doc, title, subtitle) {
  doc.fillColor(dark).font("Helvetica-Bold").fontSize(18).text(title);
  if (subtitle) doc.moveDown(.25).fillColor(muted).font("Helvetica").fontSize(9).text(subtitle);
  doc.moveDown(.8);
}
function ensure(doc, height) { if (doc.y + height > 785) doc.addPage(); }
function kpis(doc, report) {
  const items = [["TOTAL LEADS",report.overview.totalLeads],["ENQUIRIES",report.overview.totalEnquiries],["QUOTATIONS",report.overview.totalQuotations],["CONVERTED",report.overview.convertedLeads],["ACTIVE PRODUCTS",report.overview.activeProducts],["CONVERSION RATE",`${report.overview.conversionRate}%`]];
  const start=doc.y, width=164, height=58;
  items.forEach(([label,value],index)=>{const col=index%3,row=Math.floor(index/3),x=42+col*174,y=start+row*68;doc.roundedRect(x,y,width,height,8).fillAndStroke("#f8fafc",line);doc.fillColor(muted).font("Helvetica-Bold").fontSize(7).text(label,x+12,y+11,{width:140});doc.fillColor(dark).fontSize(18).text(String(value),x+12,y+27,{width:140});});
  doc.y=start+145;
}
function lineChart(doc, data, title, metric) {
  ensure(doc,235); const x=52,y=doc.y+28,w=490,h=145;heading(doc,title);
  if(!data.length){doc.fillColor(muted).fontSize(10).text("No data available for this period.",52,y+55,{align:"center",width:w});doc.y=y+h+25;return;}
  const max=Math.max(...data.map(d=>d.value),1);doc.strokeColor(line).moveTo(x,y+h).lineTo(x+w,y+h).stroke();
  data.forEach((d,i)=>{const px=x+(data.length===1?w/2:i*w/(data.length-1)),py=y+h-(d.value/max)*(h-18);if(i===0)doc.moveTo(px,py);else doc.lineTo(px,py);});doc.strokeColor(teal).lineWidth(2).stroke();
  data.forEach((d,i)=>{const px=x+(data.length===1?w/2:i*w/(data.length-1)),py=y+h-(d.value/max)*(h-18);doc.circle(px,py,2.5).fill(teal);if(i===0||i===data.length-1||i%Math.ceil(data.length/6)===0)doc.fillColor(muted).fontSize(6).text(d.label,px-22,y+h+7,{width:44,align:"center"});});
  doc.fillColor(muted).fontSize(8).text(`${metric}: ${data.reduce((sum,d)=>sum+d.value,0)}`,x,y-16);doc.y=y+h+30;
}
function verticalBars(doc,data,title) {
  ensure(doc,235);heading(doc,title);const x=52,y=doc.y+16,w=490,h=145;
  if(!data.length){doc.fillColor(muted).fontSize(10).text("No conversion data available.",52,y+55,{align:"center",width:w});doc.y=y+h+25;return;}
  const max=Math.max(...data.map(d=>d.value),1),slot=w/data.length,bw=Math.min(28,slot*.62);doc.strokeColor(line).moveTo(x,y+h).lineTo(x+w,y+h).stroke();
  data.forEach((d,i)=>{const bh=(d.value/max)*(h-18),bx=x+i*slot+(slot-bw)/2;doc.roundedRect(bx,y+h-bh,bw,bh,3).fill(palette[i%4]);if(i===0||i===data.length-1||i%Math.ceil(data.length/6)===0)doc.fillColor(muted).fontSize(6).text(d.label,bx-10,y+h+7,{width:bw+20,align:"center"});});doc.y=y+h+30;
}
function horizontalBars(doc,data,title) {
  ensure(doc,245);heading(doc,title);const x=165,y=doc.y,w=365,rowH=24,max=Math.max(...data.map(d=>d.value),1);
  if(!data.length){doc.fillColor(muted).fontSize(10).text("No product enquiry data available.");doc.moveDown(3);return;}
  data.slice(0,7).forEach((d,i)=>{const yy=y+i*rowH;doc.fillColor(dark).fontSize(7).text(d.name,45,yy+4,{width:112,align:"right",ellipsis:true});doc.roundedRect(x,yy,Math.max(2,(d.value/max)*365),14,3).fill(palette[i%4]);doc.fillColor(muted).fontSize(7).text(String(d.value),x+Math.max(5,(d.value/max)*365)+5,yy+4);});doc.y=y+Math.min(data.length,7)*rowH+18;
}
function piePath(cx,cy,r,start,end){const sx=cx+r*Math.cos(start),sy=cy+r*Math.sin(start),ex=cx+r*Math.cos(end),ey=cy+r*Math.sin(end),large=end-start>Math.PI?1:0;return `M ${cx} ${cy} L ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey} Z`;}
function pieChart(doc,data,title) {
  ensure(doc,245);heading(doc,title);if(!data.length){doc.fillColor(muted).fontSize(10).text("No customer location data available.");doc.moveDown(3);return;}
  const total=data.reduce((s,d)=>s+d.value,0),cx=170,cy=doc.y+88,r=72;let angle=-Math.PI/2;
  data.forEach((d,i)=>{const end=angle+(d.value/total)*Math.PI*2;doc.path(piePath(cx,cy,r,angle,end)).fill(palette[i%palette.length]);angle=end;doc.fillColor(dark).fontSize(8).text(`${d.name}  ${d.value} (${((d.value/total)*100).toFixed(1)}%)`,285,doc.y+i*19,{width:240});});doc.y=cy+r+24;
}
function table(doc, title, headers, rows, widths) {
  ensure(doc,100);heading(doc,title);const x=42,rowH=22;let y=doc.y;doc.rect(x,y,511,rowH).fill("#f1f5f9");let dx=x;headers.forEach((h,i)=>{doc.fillColor(dark).font("Helvetica-Bold").fontSize(7).text(h,dx+6,y+7,{width:widths[i]-12});dx+=widths[i];});y+=rowH;
  rows.forEach((row,index)=>{ensure(doc,rowH+5);if(doc.y>y)y=doc.y;if(index%2===1)doc.rect(x,y,511,rowH).fill("#f8fafc");dx=x;row.forEach((value,i)=>{doc.fillColor(dark).font("Helvetica").fontSize(7).text(String(value??"—"),dx+6,y+7,{width:widths[i]-12,ellipsis:true});dx+=widths[i];});y+=rowH;doc.y=y;});doc.moveDown(.8);
}

exports.pdf = async (req,res) => {
  const report=await buildSellerReport(req.user.id,req.query);
  const filename=`MBStore_Seller_Report_${report.filters.from}_to_${report.filters.to}.pdf`;
  res.setHeader("Content-Type","application/pdf");res.setHeader("Content-Disposition",`attachment; filename="${filename}"`);
  const doc=new PDFDocument({size:"A4",margins:{top:42,bottom:48,left:42,right:42},bufferPages:true,info:{Title:"MB Store Seller Business Performance Report",Author:"MB Store"}});doc.pipe(res);
  doc.rect(0,0,595,842).fill("#f8fafc");doc.roundedRect(32,32,531,778,14).fill("#ffffff");doc.fillColor(teal).font("Helvetica-Bold").fontSize(15).text("MB STORE",52,58);doc.fillColor(dark).fontSize(27).text("SELLER BUSINESS\nPERFORMANCE REPORT",52,105,{lineGap:5});doc.moveTo(52,190).lineTo(543,190).strokeColor("#99f6e4").lineWidth(2).stroke();
  const seller=report.seller;doc.fillColor(muted).font("Helvetica-Bold").fontSize(8).text("COMPANY",52,220);doc.fillColor(dark).fontSize(13).text(seller.companyName||"MB Store Seller",52,236);doc.fillColor(muted).fontSize(8).text("SELLER",52,274);doc.fillColor(dark).fontSize(11).text(seller.sellerName||req.user.name,52,290);doc.fillColor(muted).fontSize(8).text("REPORT PERIOD",52,326);doc.fillColor(dark).fontSize(11).text(`${dateText(report.filters.from)} – ${dateText(report.filters.to)}`,52,342);doc.fillColor(muted).fontSize(8).text("GENERATED",52,378);doc.fillColor(dark).fontSize(11).text(generatedText(report.generatedAt),52,394);doc.roundedRect(52,450,190,34,17).fill("#ecfdf5");doc.fillColor(teal).fontSize(9).text("●  LIVE BUSINESS DATA",68,463);
  const info=[["Business Email",seller.businessEmail],["Phone",seller.phone],["Website",seller.website],["GST",seller.gst]].filter(([,v])=>v);let iy=540;info.forEach(([k,v])=>{doc.fillColor(muted).fontSize(7).text(k.toUpperCase(),52,iy);doc.fillColor(dark).fontSize(9).text(v,170,iy);iy+=24;});
  doc.addPage();heading(doc,"Executive Summary",`Business activity from ${dateText(report.filters.from)} to ${dateText(report.filters.to)}`);kpis(doc,report);doc.fillColor(dark).font("Helvetica-Bold").fontSize(13).text("Performance Summary");doc.moveDown(.5).fillColor(muted).font("Helvetica").fontSize(10).text(`During the selected period, ${seller.companyName||"the seller"} received ${report.overview.totalLeads} leads and ${report.overview.totalEnquiries} product enquiries. ${report.overview.convertedLeads} leads reached the accepted quotation stage, resulting in a ${report.overview.conversionRate}% conversion rate.`,{lineGap:4});doc.moveDown(1.5);heading(doc,"Business Insights");report.insights.forEach(text=>doc.fillColor(dark).fontSize(9).text(`•  ${text}`,{indent:8,lineGap:3}).moveDown(.5));
  doc.addPage();lineChart(doc,report.monthlyLeads,"Monthly Lead Activity","Total leads");verticalBars(doc,report.leadConversion,"Lead Conversion (Accepted Quotations)");
  doc.addPage();horizontalBars(doc,report.mostEnquiredProducts,`Most Enquired ${report.filters.productGrouping==="brand"?"Brands":"Products"}`);pieChart(doc,report.customerLocations,"Customer Locations");
  doc.addPage();const productTotal=report.mostEnquiredProducts.reduce((s,d)=>s+d.value,0);table(doc,"Brand / Product Demand",["Rank",report.filters.productGrouping==="brand"?"Brand":"Product","Enquiries","Share"],report.mostEnquiredProducts.map((x,i)=>[i+1,x.name,x.value,productTotal?`${((x.value/productTotal)*100).toFixed(1)}%`:"0%"]),[40,281,90,100]);table(doc,"Quotation Performance",["Status","Total"],Object.entries(report.quotationSummary).map(([status,total])=>[status.replaceAll("_"," ").toUpperCase(),total]),[350,161]);
  doc.addPage();table(doc,"Product Performance",["Product","Brand","Enquiries","Converted"],report.productPerformance.map(x=>[x.product,x.brand,x.enquiries,x.conversions]),[220,145,73,73]);table(doc,"Recent Business Activity",["Date","Product","Location","Status"],report.recentActivity.map(x=>[new Date(x.date).toLocaleDateString("en-IN"),x.product,x.location,x.status]),[90,190,140,91]);
  const pages=doc.bufferedPageRange();for(let i=pages.start;i<pages.start+pages.count;i++){doc.switchToPage(i);doc.fillColor(muted).font("Helvetica").fontSize(7).text(`MB Store  •  Seller Business Report  •  ${report.filters.from} to ${report.filters.to}`,42,814,{width:400});doc.text(`Page ${i+1} of ${pages.count}`,470,814,{width:83,align:"right"});}
  doc.end();
};
