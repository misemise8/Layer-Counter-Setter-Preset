(function() {
  const cs = new CSInterface();
  const ext = cs.getSystemPath(SystemPath.EXTENSION).replace(/\\/g, '\\\\');
  const jsxBase = `${ext}/jsx/`;

  // ExtendScript 読み込み
  ['function.jsx','simpleFrameCounter.jsx','simpleCompSetter.jsx','ffxPreset.jsx']
    .forEach(f => cs.evalScript(`$.evalFile(\"${jsxBase}${f}\")`));

  document.addEventListener('DOMContentLoaded', () => {
    // タブ切り替え
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.addEventListener('click', () => {
        const tgt = btn.dataset.tab;
        document.querySelectorAll('.tab-button').forEach(b => b.classList.toggle('active', b===btn));
        document.querySelectorAll('.tab-content').forEach(c => {
          if (c.id === tgt) c.classList.add('active');
          else c.classList.remove('active');
        });
      });
    });

    // Frame Counter
    const resultBox = document.getElementById('resultBox');
    document.getElementById('btnStart')?.addEventListener('click', () =>
      cs.evalScript('sfc_countStart()', res => resultBox.value = res)
    );
    document.getElementById('btnEnd')?.addEventListener('click', () =>
      cs.evalScript('sfc_countEnd()', res => resultBox.value = res)
    );

    // Layer 追加
    const layerMap = {
      'btn-add-camera':'addCameraAboveSelectedLayers()',
      'btn-add-null-1':'addNullLayers(1)',
      'btn-add-adjustment':'addAdjustmentLayer()',
      'btn-add-null-2':'addNullLayers(2)',
      'btn-add-one-frame':'addOneFrameAdjustmentLayer()',
      'btn-add-solid':'addSolidLayer()',
      'btn-add-null-3':'addNullLayers(3)',
      'btn-split-dimensions':'splitLayersIntoDimensions()',
      'btn-add-text':'addTextLayer()',
      'btn-save-project':'saveProject()'
    };
    Object.entries(layerMap).forEach(([id,fn]) =>
      document.getElementById(id)?.addEventListener('click', () => cs.evalScript(fn))
    );

    // Motion Tile
    document.getElementById('btn-add-motion-tile')?.addEventListener('click', () =>
      cs.evalScript('app.beginUndoGroup(\"Motion Tile\");\napplyMotionTileEffect();\napp.endUndoGroup();')
    );

    // Comp Setter
    document.getElementById('btnApplyComp')?.addEventListener('click', () => {
      const w=+document.getElementById('compWidth').value;
      const h=+document.getElementById('compHeight').value;
      const fps=+document.getElementById('compFps').value;
      const dur=+document.getElementById('compDuration').value;
      const isFrame = document.getElementById('durationUnit').value === 'frames';
      const setDur = document.getElementById('setDuration').checked;
      cs.evalScript(`setCompSettings(${w},${h},${fps},${dur},${isFrame},${setDur},false)`);
    });
    document.getElementById('btnCenterLayers')?.addEventListener('click', () =>
      cs.evalScript('centerAllLayers()')
    );

    // Resolution/FPS プリセット
    document.getElementById('presetResolution')?.addEventListener('change', e => {
      const v=e.target.value;
      if(v==='active'){
        cs.evalScript('getActiveCompResolution()', res=>{
          const [w,h]=res.split(',').map(Number);
          document.getElementById('compWidth').value=w;
          document.getElementById('compHeight').value=h;
        });
      } else if(v.includes('x')){
        const [w,h]=v.split('x').map(Number);
        document.getElementById('compWidth').value=w;
        document.getElementById('compHeight').value=h;
      }
    });
    document.getElementById('presetFramerate')?.addEventListener('change', e => {
      const v=e.target.value;
      if(v==='active') cs.evalScript('getActiveCompFps()',res=>document.getElementById('compFps').value=+res);
      else document.getElementById('compFps').value=v;
    });

    // FFX Preset 設定モーダル／モデルレス
    const toggleWindow = document.getElementById('toggleWindow');
    const btnCus = document.getElementById('btn-customize-presets');
    const overlay = document.getElementById('configOverlay');
    const iframe = document.getElementById('configFrame');
    const configURL = `file://${ext}/config.html`;

    let presets = JSON.parse(localStorage.getItem('ffxPresetConfig') || '[]');
    applyPresetUI(presets);

    btnCus?.addEventListener('click', () => {
      const url = `${configURL}?ts=${Date.now()}`;
      if(toggleWindow?.checked) {
        try{
          cs.openModelessDialog(url, 'PresetConfig', 'width=600,height=700');
        } catch(e){
          console.warn('ModelessDialog failed',e);
          cs.openURLInDefaultBrowser(configURL);
        }
      } else {
        iframe.src = url;
        overlay.style.display = 'flex';
      }
    });

    overlay.addEventListener('click', e => {
      if(e.target === overlay){ overlay.style.display='none'; iframe.src=''; }
    });

    window.addEventListener('message', e => {
      if(e.data?.type==='loadPresets'){
        presets = e.data.configs || presets; applyPresetUI(presets);
      }
      if(e.data?.type==='savePresets'){
        presets = e.data.configs; localStorage.setItem('ffxPresetConfig', JSON.stringify(presets));
        applyPresetUI(presets);
        if(!toggleWindow?.checked) { overlay.style.display='none'; iframe.src=''; }
      }
    });

    document.querySelectorAll('.preset-apply').forEach((btn,i) => {
      btn.addEventListener('click', () => {
        const c = presets[i] || {};
        if(!c.path) return alert('プリセットを設定してください');
        cs.evalScript(`applyPreset(\"${c.path.replace(/\\/g,'\\\\')}\")`);
      });
    });

    function applyPresetUI(list){
      document.querySelectorAll('.preset-apply').forEach((btn,i)=>{
        const c=list[i]||{};
        if(c.path){ btn.disabled=false; btn.textContent=c.label||c.path.split(/[\\/]/).pop().slice(0,7); }
        else{ btn.disabled=true; btn.textContent=`Slot ${i+1}`; }
      });
    }
  });
})();