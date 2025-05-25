// ユーザーに .ffx ファイルを選択させ、そのパスを返す
function selectPresetFile() {
  var f = File.openDialog("Select FFX Preset", "*.ffx");
  return f ? f.fsName : null;
}

// 選択レイヤーにプリセットを適用
function applyPreset(presetPath) {
  var comp = app.project.activeItem;
  if (!(comp instanceof CompItem)) {
    alert("コンポジションをアクティブにしてください。");
    return;
  }
  app.beginUndoGroup("Apply FFX Preset");
  var sel = comp.selectedLayers;
  if (!sel.length) {
    alert("レイヤーを選択してください。");
    app.endUndoGroup();
    return;
  }
  for (var i = 0; i < sel.length; i++) {
    sel[i].applyPreset(new File(presetPath));
  }
  app.endUndoGroup();
}
