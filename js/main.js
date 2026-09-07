const b=document.querySelector('.menu-toggle'),n=document.querySelector('.nav');if(b&&n)b.addEventListener('click',()=>{const o=n.classList.toggle('open');b.setAttribute('aria-expanded',o)});

const canvas=document.querySelector('.math-field');
if(canvas){
  const ctx=canvas.getContext('2d');
  const hero=canvas.closest('.hero');
  const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width=0,height=0,dpr=1,frame=0,pointer={x:.72,y:.5,active:false};
  let ripples=[];

  const nodes=Array.from({length:window.innerWidth<620?58:88},(_,i)=>({
    x:(i*47%101)/100,
    y:(i*67%97)/100,
    phase:i*.71,
    radius:i%11===0?3.6:i%5===0?2.3:1.5
  }));

  function resize(){
    const box=hero.getBoundingClientRect();
    width=box.width;height=box.height;dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function drawGrid(){
    const spacing=42;
    ctx.fillStyle='rgba(23,61,145,.05)';
    for(let gx=spacing/2;gx<width;gx+=spacing){
      for(let gy=spacing/2;gy<height;gy+=spacing){
        ctx.fillRect(gx,gy,1,1);
      }
    }
  }

  function drawRipples(time){
    ripples=ripples.filter(r=>time-r.start<1100);
    ripples.forEach(r=>{
      const p=Math.min((time-r.start)/1100,1);
      ctx.strokeStyle=`rgba(23,61,145,${(1-p)*.32})`;
      ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(r.x,r.y,p*150,0,Math.PI*2);ctx.stroke();
    });
  }

  function draw(time=0){
    ctx.clearRect(0,0,width,height);
    drawGrid();
    const t=reduceMotion?0:time*.00018;
    const points=nodes.map(node=>{
      let x=node.x*width+Math.sin(t*4+node.phase)*7;
      let y=node.y*height+Math.cos(t*3+node.phase)*6;
      if(pointer.active){
        const dx=x-pointer.x*width,dy=y-pointer.y*height,dist=Math.hypot(dx,dy);
        if(dist<190&&dist>0){const push=(190-dist)/190*32;x+=dx/dist*push;y+=dy/dist*push;}
      }
      const pulse=.8+.2*Math.sin(t*6+node.phase);
      return {...node,x,y,pulse};
    });
    ctx.lineWidth=.65;
    for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
      const distance=Math.hypot(points[i].x-points[j].x,points[i].y-points[j].y);
      if(distance<92){
        const nearPointer=pointer.active&&Math.min(
          Math.hypot(points[i].x-pointer.x*width,points[i].y-pointer.y*height),
          Math.hypot(points[j].x-pointer.x*width,points[j].y-pointer.y*height)
        )<190;
        ctx.strokeStyle=`rgba(23,61,145,${(nearPointer?.45:.16)*(1-distance/92)})`;
        ctx.beginPath();ctx.moveTo(points[i].x,points[i].y);ctx.lineTo(points[j].x,points[j].y);ctx.stroke();
      }
    }
    points.forEach(point=>{
      const pointerDistance=pointer.active?Math.hypot(point.x-pointer.x*width,point.y-pointer.y*height):Infinity;
      const reactiveScale=pointerDistance<190?1+(190-pointerDistance)/85:1;
      const alpha=(point.radius>3?.68:point.radius>2?.5:.4)*point.pulse;
      ctx.fillStyle=pointerDistance<190?'rgba(23,61,145,.86)':point.radius>3?`rgba(16,37,77,${alpha})`:`rgba(71,108,174,${alpha})`;
      ctx.beginPath();ctx.arc(point.x,point.y,point.radius*reactiveScale,0,Math.PI*2);ctx.fill();
    });
    if(!reduceMotion)drawRipples(time);
    if(!reduceMotion)frame=requestAnimationFrame(draw);
  }

  hero.addEventListener('pointermove',event=>{
    const box=hero.getBoundingClientRect();
    pointer={x:(event.clientX-box.left)/box.width,y:(event.clientY-box.top)/box.height,active:true};
  });
  hero.addEventListener('pointerleave',()=>{pointer.active=false;});
  if(!reduceMotion){
    hero.addEventListener('pointerdown',event=>{
      const box=hero.getBoundingClientRect();
      ripples.push({x:event.clientX-box.left,y:event.clientY-box.top,start:performance.now()});
      if(ripples.length>4)ripples.shift();
    });
  }
  window.addEventListener('resize',()=>{resize();if(reduceMotion)draw();});
  resize();draw();
  window.addEventListener('pagehide',()=>cancelAnimationFrame(frame),{once:true});
}
