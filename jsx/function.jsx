// function.jsx
// Utility to run ExtendScript actions safely with undo group
function safeRun(fn) {
    try {
        app.beginUndoGroup(fn.name);
        var result = fn();
        app.endUndoGroup();
        return result === undefined ? "OK" : result;
    } catch (e) {
        app.endUndoGroup();
        return "Error in " + fn.name + ": " + e.toString();
    }
}

// 1. Add Camera above selected layers
function addCameraAboveSelectedLayers() {
    return safeRun(function() {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) { alert("Please select a composition."); return; }
        var selected = comp.selectedLayers;
        var compWidth = comp.width, compHeight = comp.height;
        var cameraLayer;
        if (selected.length > 0) {
            var first = selected[0];
            cameraLayer = comp.layers.addCamera("Camera for " + first.name, [compWidth*0.5, compHeight*0.5]);
            cameraLayer.position.setValue([compWidth*0.5, compHeight*0.5, -cameraLayer.zoom.value]);
            cameraLayer.moveBefore(first);
            cameraLayer.inPoint = first.inPoint;
            cameraLayer.outPoint = first.outPoint;
        } else {
            cameraLayer = comp.layers.addCamera("Camera 1", [compWidth*0.5, compHeight*0.5]);
            cameraLayer.position.setValue([compWidth*0.5, compHeight*0.5, -cameraLayer.zoom.value]);
            cameraLayer.moveToBeginning();
            cameraLayer.inPoint = comp.time;
            cameraLayer.outPoint = comp.time + comp.duration;
        }
        var opts = cameraLayer.property("ADBE Camera Options Group");
        if (opts) opts.property("ADBE DOF").setValue(false);
    });
}

// 2. Add Solid Layer (black) matching selected
function addSolidLayer() {
    return safeRun(function() {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) { alert("Please select a composition."); return; }
        var sel = comp.selectedLayers;
        if (sel.length === 0) { alert("Please select at least one layer."); return; }
        var ref = sel[0];
        var solid = comp.layers.addSolid([0,0,0], "Black Solid", comp.width, comp.height, comp.pixelAspect);
        solid.moveBefore(ref);
        solid.inPoint = ref.inPoint;
        solid.outPoint = ref.outPoint;
        var fill = solid.property("Effects").addProperty("Fill");
        if (fill) fill.property("Color").setValue([0,0,0]);
    });
}

// 3. Add Adjustment Layer matching selected
function addAdjustmentLayer() {
    return safeRun(function() {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) { alert("Please select a composition."); return; }
        var sel = comp.selectedLayers;
        if (sel.length === 0) { alert("Please select at least one layer."); return; }
        var ref = sel[0];
        var adj = comp.layers.addSolid([1,1,1], "Adjustment Layer", comp.width, comp.height, comp.pixelAspect);
        adj.adjustmentLayer = true;
        adj.moveBefore(ref);
        adj.inPoint = ref.inPoint;
        adj.outPoint = ref.outPoint;
    });
}

// 4. Add Text Layer
function addTextLayer() {
    return safeRun(function() {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) { alert("Please select a composition."); return; }
        var sel = comp.selectedLayers;
        var textLayer = comp.layers.addText("New Text");
        var bounds = textLayer.sourceRectAtTime(comp.time, false);
        textLayer.anchorPoint.setValue([bounds.left + bounds.width/2, bounds.top + bounds.height/2]);
        textLayer.position.setValue([comp.width/2, comp.height/2]);
        if (sel.length > 0) {
            var ref = sel[0];
            textLayer.moveBefore(ref);
            textLayer.inPoint = ref.inPoint;
            textLayer.outPoint = ref.outPoint;
        } else {
            textLayer.moveToBeginning();
            textLayer.inPoint = comp.time;
            textLayer.outPoint = comp.time + comp.duration;
        }
    });
}

// 5. Add Null Layers with hierarchical parenting
function addNullLayers(count) {
    return safeRun(function() {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) { alert("Please select a composition."); return; }
        var sel = comp.selectedLayers;
        if (sel.length === 0) { alert("Please select at least one layer."); return; }
        var parentLayer = sel[0];
        var nullLayers = [];
        for (var i = 0; i < count; i++) {
            var nl = comp.layers.addNull();
            nl.name = "Null " + (i+1);
            nl.moveBefore(parentLayer);
            nl.inPoint = parentLayer.inPoint;
            nl.outPoint = parentLayer.outPoint;
            nullLayers.push(nl);
        }
        // Reverse order to link top-down
        nullLayers.reverse();
        // Parent selected layers to first null
        for (var j=0; j<sel.length; j++) {
            sel[j].parent = nullLayers[0];
        }
        // Chain nulls
        for (var k=0; k<nullLayers.length-1; k++) {
            nullLayers[k].parent = nullLayers[k+1];
        }
    });
}

// 6. Motion Tile Effect (undo handled by safeRun)
function applyMotionTileEffect() {
    //alert("STEP 1: start");

    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        //alert("STEP 2: No active comp");
        return;
    }

    var sel = comp.selectedLayers;
    if (sel.length === 0) {
        //alert("STEP 3: No layers selected");
        return;
    }

    for (var i = 0; i < sel.length; i++) {
        //alert("STEP 4: Layer " + i);
        var layer = sel[i];
        try {
            var motionTile = layer.property("Effects").addProperty("Motion Tile");
            if (motionTile) {
                //alert("STEP 5: Effect added");
                motionTile.property("Output Width").setValue(300);
                motionTile.property("Output Height").setValue(300);
                motionTile.property("Mirror Edges").setValue(true);
            } else {
                //alert("STEP 6: Effect NOT added");
            }
        } catch (e) {
            alert("STEP ERROR: " + e.toString());
        }
    }

    //alert("STEP 7: done");
}


// 7. One Frame Adjustment Layer (undo handled by safeRun)
function addOneFrameAdjustmentLayer() {
    return safeRun(function() {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) { alert("Please select a composition."); return; }
        if (comp.selectedLayers.length) {
            var first = comp.selectedLayers[0];
            var cur = comp.time;
            var dur = comp.frameDuration;
            var adj = comp.layers.addSolid([1,1,1], "Adjustment Layer", comp.width, comp.height, comp.pixelAspect);
            adj.adjustmentLayer = true;
            adj.inPoint = cur;
            adj.outPoint = cur + dur;
            adj.moveBefore(first);
        }
    });
}

// 8. Split Dimensions (undo handled by safeRun)
function splitLayersIntoDimensions() {
    return safeRun(function() {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) { alert("Please select a composition."); return; }
        var layers = comp.selectedLayers.length ? comp.selectedLayers : (function(){
            var arr = [];
            for (var i=1; i<=comp.numLayers; i++) arr.push(comp.layer(i));
            return arr;
        })();
        for (var i=0; i<layers.length; i++) {
            var l = layers[i];
            var pos = l.property("ADBE Transform Group").property("ADBE Position");
            if (pos && !pos.dimensionsSeparated) pos.dimensionsSeparated = true;
        }
    });
}

// 9. Save Project
function saveProject() {
    var proj = app.project;
    if (proj.file) proj.save();
    else {
        var f = File.saveDialog("Save your project");
        if (f) proj.save(f);
    }
}

// 10.simpleFrameCounter.jsx

// loaded signal
"function.jsx loaded";


$.global.applyMotionTileEffect = applyMotionTileEffect;
$.global.addCameraAboveSelectedLayers = addCameraAboveSelectedLayers;
$.global.addNullLayers = addNullLayers;
$.global.addAdjustmentLayer = addAdjustmentLayer;
$.global.addOneFrameAdjustmentLayer = addOneFrameAdjustmentLayer;
$.global.addSolidLayer = addSolidLayer;
$.global.addTextLayer = addTextLayer;
$.global.splitLayersIntoDimensions = splitLayersIntoDimensions;
$.global.saveProject = saveProject;