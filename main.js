(function () {
  const cs = new CSInterface();
  const ext = cs.getSystemPath(SystemPath.EXTENSION).replace(/\\/g, '\\\\');
  const jsxBase = `${ext}/jsx/`;

  // ExtendScript 読み込み
  ['function.jsx', 'simpleFrameCounter.jsx', 'simpleCompSetter.jsx', 'ffxPreset.jsx']
    .forEach(f => cs.evalScript(`$.evalFile(\"${jsxBase}${f}\")`));

  document.addEventListener('DOMContentLoaded', () => {
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
    document.getElementById('btnStart')?.addEventListener('click', () =>
      cs.evalScript('sfc_countStart()', r => resultBox.value = r)
    );
    document.getElementById('btnEnd')?.addEventListener('click', () =>
      cs.evalScript('sfc_countEnd()', r => resultBox.value = r)
    );

    // Layer追加ボタン
    [
      ['btn-add-camera',       'addCameraAboveSelectedLayers()'],
      ['btn-add-null-1',       'addNullLayers(1)'],
      ['btn-add-adjustment',   'addAdjustmentLayer()'],
      ['btn-add-null-2',       'addNullLayers(2)'],
      ['btn-add-one-frame',    'addOneFrameAdjustmentLayer()'],
      ['btn-add-solid',        'addSolidLayer()'],
      ['btn-add-null-3',       'addNullLayers(3)'],
      ['btn-split-dimensions', 'splitLayersIntoDimensions()'],
      ['btn-add-text',         'addTextLayer()'],
      ['btn-save-project',     'saveProject()']
    ].forEach(([id, fn]) => {
      document.getElementById(id)?.addEventListener('click', () =>
        cs.evalScript(fn)
      );
    });

    // Motion Tile
    document.getElementById('btn-add-motion-tile')?.addEventListener('click', () =>
      cs.evalScript(
        'app.beginUndoGroup(\"Motion Tile\");\napplyMotionTileEffect();\napp.endUndoGroup();'
      )
    );

    // Comp Setter
    document.getElementById('btnApplyComp')?.addEventListener('click', () => {
      const w = +document.getElementById('compWidth').value;
      const h = +document.getElementById('compHeight').value;
      const fps = +document.getElementById('compFps').value;
      const dur = +document.getElementById('compDuration').value;
      const isFrame = document.getElementById('durationUnit').value === 'frames';
      const setDur = document.getElementById('setDuration').checked;
      cs.evalScript(`setCompSettings(${w},${h},${fps},${dur},${isFrame},${setDur},false)`);
    });
    document.getElementById('btnCenterLayers')?.addEventListener('click', () =>
      cs.evalScript('centerAllLayers()')
    );

    // 解像度プリセット
    document.getElementById('presetResolution')?.addEventListener('change', e => {
      const v = e.target.value;
      if (v === 'active') {
        cs.evalScript('getActiveCompResolution()', res => {
          const [w, h] = res.split(',').map(Number);
          document.getElementById('compWidth').value = w;
          document.getElementById('compHeight').value = h;
        });
      } else if (v) {
        const [w, h] = v.split('x').map(Number);
        document.getElementById('compWidth').value = w;
        document.getElementById('compHeight').value = h;
      }
    });
    document.getElementById('presetFramerate')?.addEventListener('change', e => {
      const v = e.target.value;
      if (v === 'active') cs.evalScript('getActiveCompFps()', fps =>
        document.getElementById('compFps').value = +fps
      );
      else if (v) document.getElementById('compFps').value = v;
    });

    // FFX Preset: モーダル or モデルレスダイアログ
    const toggleWindow = document.getElementById('toggleWindow');
    const btnCustomize  = document.getElementById('btn-customize-presets');
    const overlay       = document.getElementById('configOverlay');
    const iframe        = document.getElementById('configFrame');

    // 永続化から読み込み
    window.ffxPresetConfig = JSON.parse(localStorage.getItem('ffxPresetConfig') || '[]');
    receivePresetConfig(window.ffxPresetConfig);

    btnCustomize.addEventListener('click', () => {
      if (toggleWindow?.checked) {
        try {
          // まず CEP モデルレスダイアログ
          cs.openModelessDialog(
            `file://${ext}/html/config.html`,
            'PresetConfig',
            'width=600,height=700'
          );
        } catch (e) {
          // 万が一エラーなら外部ブラウザ
          console.warn('ModelessDialog failed:', e);
          cs.openURLInDefaultBrowser(`file://${ext}/html/config.html`);
        }
      } else {
        // 既存の iframe モーダル
        iframe.src = 'config.html';
        overlay.style.display = 'flex';
        iframe.onload = () => {
          iframe.contentWindow.postMessage({ type:'loadPresets', configs: ffxConfig }, '*');
        };
      }
    });

    // モーダル閉じる
    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        overlay.style.display = 'none';
        iframe.src = '';
      }
    });

    // 子からの保存データ受信
    window.addEventListener('message', e => {
      if (e.data?.type === 'savePresets' && Array.isArray(e.data.configs)) {
        receivePresetConfig(e.data.configs);
        localStorage.setItem('ffxPresetConfig', JSON.stringify(e.data.configs));
        if (!toggleWindow?.checked) {
          overlay.style.display = 'none';
          iframe.src = '';
        }
      }
    });

    // プリセット適用
    document.querySelectorAll('.preset-apply').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        const cfg = window.ffxPresetConfig[i] || {};
        if (!cfg.path) return alert('まずプリセットを設定してください。');
        cs.evalScript(`applyPreset("${cfg.path.replace(/\\/g,'\\\\')} ")`);
      });
    });

    // 設定反映ヘルパー
    function receivePresetConfig(configs) {
      window.ffxPresetConfig = configs;
      document.querySelectorAll('.preset-apply').forEach((btn, i) => {
        const cfg = configs[i] || {};
        if (cfg.path) {
          btn.disabled = false;
          btn.textContent = cfg.label || cfg.path.split(/[\\/]/).pop().slice(0,7);
        } else {
          btn.disabled = true;
          btn.textContent = `Slot ${i+1}`;
        }
      });
    }
  });
})();
