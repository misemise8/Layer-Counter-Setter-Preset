(function () {
  const cs = new CSInterface();
  const ext = cs.getSystemPath(SystemPath.EXTENSION).replace(/\\/g, '\\\\');
  const jsxBase = `${ext}/jsx/`;

  // ExtendScript 読み込み
  ['function.jsx', 'simpleFrameCounter.jsx', 'simpleCompSetter.jsx', 'ffxPreset.jsx']
    .forEach(f => cs.evalScript(`$.evalFile("${jsxBase}${f}")`));

  // タブ切り替え
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const tgt = btn.dataset.tab;
      document.querySelectorAll('.tab-button')
        .forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.tab-content')
        .forEach(c => c.classList.toggle('active', c.id === tgt));
    });
  });

  // Frame Counter
  const resultBox = document.getElementById('resultBox');
  const btnStart = document.getElementById('btnStart');
  const btnEnd = document.getElementById('btnEnd');
  if (btnStart && resultBox) {
    btnStart.onclick = () =>
      cs.evalScript('sfc_countStart()', r => resultBox.value = r);
  }
  if (btnEnd && resultBox) {
    btnEnd.onclick = () =>
      cs.evalScript('sfc_countEnd()', r => resultBox.value = r);
  }

  // Layer追加ボタン
  const layerButtons = [
    { id: 'btn-add-camera', fn: 'addCameraAboveSelectedLayers()' },
    { id: 'btn-add-null-1', fn: 'addNullLayers(1)' },
    { id: 'btn-add-motion-tile', fn: null },
    { id: 'btn-add-adjustment', fn: 'addAdjustmentLayer()' },
    { id: 'btn-add-null-2', fn: 'addNullLayers(2)' },
    { id: 'btn-add-one-frame', fn: 'addOneFrameAdjustmentLayer()' },
    { id: 'btn-add-solid', fn: 'addSolidLayer()' },
    { id: 'btn-add-null-3', fn: 'addNullLayers(3)' },
    { id: 'btn-split-dimensions', fn: 'splitLayersIntoDimensions()' },
    { id: 'btn-add-text', fn: 'addTextLayer()' },
    { id: 'btn-save-project', fn: 'saveProject()' }
  ];

  layerButtons.forEach(({ id, fn }) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    if (!fn) {
      console.warn(`ボタン ${id} に関数が設定されていません`);
      return;
    }
    btn.addEventListener('click', () =>
      cs.evalScript(fn, res => console.log(`${fn} →`, res))
    );
  });

  // Motion Tile
  const btnMotion = document.getElementById('btn-add-motion-tile');
  if (btnMotion) {
    btnMotion.addEventListener('click', () => {
      cs.evalScript(
        [
          'app.beginUndoGroup("Motion Tile");',
          'applyMotionTileEffect();',
          'app.endUndoGroup();'
        ].join('\n'),
        res => console.log('MotionTile →', res)
      );
    });
  }

  // Comp Setter
  const btnApply = document.getElementById('btnApplyComp');
  const btnCenter = document.getElementById('btnCenterLayers');
  if (btnApply) {
    btnApply.addEventListener('click', () => {
      const width = parseInt(document.getElementById('compWidth').value, 10);
      const height = parseInt(document.getElementById('compHeight').value, 10);
      const fps = parseFloat(document.getElementById('compFps').value);
      const duration = parseFloat(document.getElementById('compDuration').value);
      const unit = document.getElementById('durationUnit').value;
      const isFrameBased = (unit === 'frames');
      const setDuration = document.getElementById('setDuration').checked;
      const useLayerSize = false;
      const jsxCall = `setCompSettings(${width}, ${height}, ${fps}, ${duration}, ${isFrameBased}, ${setDuration}, ${useLayerSize})`;
      cs.evalScript(jsxCall);
    });
  }
  if (btnCenter) {
    btnCenter.addEventListener('click', () =>
      cs.evalScript('centerAllLayers()')
    );
  }

  // 解像度プリセット
  const presetRes = document.getElementById('presetResolution');
  if (presetRes) {
    presetRes.addEventListener('change', () => {
      const val = presetRes.value;
      if (val === 'active') {
        cs.evalScript('getActiveCompResolution()', res => {
          const [w, h] = res.split(',').map(Number);
          document.getElementById('compWidth').value = w;
          document.getElementById('compHeight').value = h;
        });
      } else if (val) {
        const [w, h] = val.split('x').map(Number);
        document.getElementById('compWidth').value = w;
        document.getElementById('compHeight').value = h;
      }
    });
  }

  const presetFps = document.getElementById('presetFramerate');
  if (presetFps) {
    presetFps.addEventListener('change', () => {
      const val = presetFps.value;
      if (val === 'active') {
        cs.evalScript('getActiveCompFps()', fps =>
          document.getElementById('compFps').value = parseFloat(fps)
        );
      } else if (val) {
        document.getElementById('compFps').value = val;
      }
    });
  }

  // FFXプリセット設定
  (function () {
    const cs4 = new CSInterface();
    const SLOT_COUNT = 8;

    // 🔽 永続保存から復元
    let savedPresets = [];
    try {
      const stored = localStorage.getItem('ffxPresetConfig');
      if (stored) savedPresets = JSON.parse(stored);
    } catch (e) {
      console.warn('プリセット設定の読み込みに失敗しました', e);
    }

    window.ffxPresetConfig = Array(SLOT_COUNT).fill({ path: null, label: null });
    const applyButtons = document.querySelectorAll('.preset-apply');

    savedPresets.forEach((cfg, idx) => {
      const btn = applyButtons[idx];
      if (!btn) return;
      if (cfg && cfg.path) {
        btn.disabled = false;
        btn.textContent = cfg.label || cfg.path.replace(/^.*[\\/]/, '').slice(0, 7);
        window.ffxPresetConfig[idx] = cfg;
      }
    });

    const overlay = document.getElementById('configOverlay');
    const iframe = document.getElementById('configFrame');
    const btnCustomize = document.getElementById('btn-customize-presets');

    window.closeConfigModal = function () {
      if (overlay) overlay.style.display = 'none';
    };

    if (btnCustomize) {
      btnCustomize.addEventListener('click', () => {
        iframe.src = 'config.html?' + new Date().getTime();
        overlay.style.display = 'flex';

        iframe.onload = () => {
          iframe.contentWindow.postMessage({
            type: 'loadPresets',
            configs: window.ffxPresetConfig
          }, '*');
        };
      });
    }

    applyButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const cfg = window.ffxPresetConfig[idx];
        if (!cfg.path) return alert('まずプリセットを設定してください。');
        const esc = cfg.path.replace(/\\/g, '\\\\');
        cs4.evalScript(`applyPreset("${esc}")`);
      });
    });

    // 🔽 保存反映と永続化
    window.receivePresetConfig = function (configs) {
      configs.forEach((cfg, idx) => {
        const btn = applyButtons[idx];
        if (!btn) return;
        if (cfg.path) {
          btn.disabled = false;
          btn.textContent = cfg.label || cfg.path.replace(/^.*[\\/]/, '').slice(0, 7);
          window.ffxPresetConfig[idx] = cfg;
        } else {
          btn.disabled = true;
          btn.textContent = `Slot ${idx + 1}`;
          window.ffxPresetConfig[idx] = { path: null, label: null };
        }
      });

      // ✅ 永続化
      localStorage.setItem('ffxPresetConfig', JSON.stringify(configs));
    };

    overlay.addEventListener('click', e => {
      if (e.target === overlay) window.closeConfigModal();
    });
  })();
})();
