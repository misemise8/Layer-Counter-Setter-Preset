function setCompSettings(width, height, fps, duration, isFrameBased, setDuration, useLayerSize) {
    if (!(app.project && app.project.activeItem instanceof CompItem)) {
        alert("Please activate a composition.");
        return;
    }

    var comp = app.project.activeItem;

    if (useLayerSize && comp.selectedLayers.length > 0) {
        var layer = comp.selectedLayers[0];
        if (layer.source && layer.source.hasOwnProperty("width") && layer.source.hasOwnProperty("height")) {
            width = layer.source.width;
            height = layer.source.height;
        } else {
            alert("Could not get layer resolution.");
            return;
        }
    }

    app.beginUndoGroup("Set Comp Settings");
    comp.width = width;
    comp.height = height;
    comp.frameRate = fps;
    if (setDuration) {
        comp.duration = isFrameBased ? (duration / fps) : duration;
    }
    app.endUndoGroup();
}

function centerAllLayers() {
    if (!(app.project && app.project.activeItem instanceof CompItem)) {
        alert("Please activate a composition.");
        return;
    }

    var comp = app.project.activeItem;
    var centerX = comp.width / 2;
    var centerY = comp.height / 2;

    app.beginUndoGroup("Center All Layers");
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        if (layer.property("Position") && layer.threeDLayer === false) {
            layer.property("Position").setValue([centerX, centerY]);
        }
    }
    app.endUndoGroup();
}
//
function getActiveCompResolution() {
  var comp = app.project.activeItem;
  if (comp instanceof CompItem) {
    return comp.width + "," + comp.height;
  }
  return "1920,1080";
}

function getActiveCompFps() {
  var comp = app.project.activeItem;
  if (comp instanceof CompItem) {
    return comp.frameRate.toFixed(2);
  }
  return "29.97";
}
