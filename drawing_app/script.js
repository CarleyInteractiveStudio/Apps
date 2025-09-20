window.addEventListener('load', () => {
    // --- DOM ELEMENTS ---
    const canvasContainer = document.getElementById('canvas-container');
    const colorPalette = document.getElementById('color-palette');
    const brushSizeSlider = document.getElementById('brush-size');
    const clearCanvasBtn = document.getElementById('clear-canvas');
    const addLayerBtn = document.getElementById('add-layer-btn');
    const layerList = document.getElementById('layer-list');
    const saveProjectBtn = document.getElementById('save-project-btn');
    const openProjectInput = document.getElementById('open-project-input');
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const zoomResetBtn = document.getElementById('zoom-reset-btn');
    const toolGroup = document.querySelector('.tool-group');
    const timelineControls = document.getElementById('timeline-controls');
    const frameTrack = document.getElementById('frame-track');
    const addFrameBtn = document.getElementById('add-frame-btn');
    const duplicateFrameBtn = document.getElementById('duplicate-frame-btn');
    const deleteFrameBtn = document.getElementById('delete-frame-btn');
    const playBtn = document.getElementById('play-btn');
    const stopBtn = document.getElementById('stop-btn');
    const onionSkinBtn = document.getElementById('onion-skin-btn');
    const fpsInput = document.getElementById('fps-input');

    // --- STATE MANAGEMENT ---
    window.layers = [];
    let activeLayerId = null;
    let nextLayerId = 1;

    const view = { scale: 1.0, offsetX: 0, offsetY: 0 };

    const animationState = {
        currentFrame: 0,
        totalFrames: 1,
        isPlaying: false,
        fps: 12,
        onionSkinning: false,
        playbackInterval: null
    };

    let isDrawing = false;
    let isDrawingShape = false;
    let lastX = 0, lastY = 0, shapeStartX = 0, shapeStartY = 0;
    let brushSize = 5, currentColor = '#000000', currentTool = 'pencil';

    // --- CORE FUNCTIONS ---
    function createNewLayer(name, setActive = true) {
        const layerId = nextLayerId++;
        const viewCanvas = document.createElement('canvas');
        viewCanvas.id = `layer-view-${layerId}`;
        viewCanvas.className = 'layer-canvas';
        viewCanvas.width = 800;
        viewCanvas.height = 600;
        canvasContainer.appendChild(viewCanvas);

        const newLayer = {
            id: layerId,
            name: name || `Capa ${layerId}`,
            viewCanvas: viewCanvas,
            viewCtx: viewCanvas.getContext('2d'),
            frames: [], // Each layer now has an array of frames
            isVisible: true
        };

        // Populate frames for the new layer
        for (let i = 0; i < animationState.totalFrames; i++) {
            const modelCanvas = document.createElement('canvas');
            modelCanvas.width = 800;
            modelCanvas.height = 600;
            newLayer.frames.push({ modelCanvas: modelCanvas, modelCtx: modelCanvas.getContext('2d') });
        }

        window.layers.push(newLayer);
        canvasContainer.insertBefore(viewCanvas, canvasContainer.firstChild);

        if (setActive) setActiveLayer(layerId);
        renderLayerList();
        return newLayer;
    }

    function getActiveLayer() {
        return window.layers.find(layer => layer.id === activeLayerId);
    }

    function getActiveModelContext() {
        const activeLayer = getActiveLayer();
        if (!activeLayer || !activeLayer.frames[animationState.currentFrame]) return null;
        return activeLayer.frames[animationState.currentFrame].modelCtx;
    }

    function redrawAllLayers() {
        window.layers.forEach(layer => redrawSingleLayer(layer));
    }

    window.redrawSingleLayer = function(layer) {
        if (!layer) return;

        const viewCtx = layer.viewCtx;
        const currentFrameIndex = animationState.currentFrame;

        viewCtx.clearRect(0, 0, layer.viewCanvas.width, layer.viewCanvas.height);

        if (!layer.isVisible) return;

        // --- Onion Skinning ---
        if (animationState.onionSkinning) {
            // Draw previous frame
            if (currentFrameIndex > 0) {
                const prevFrame = layer.frames[currentFrameIndex - 1];
                viewCtx.save();
                viewCtx.globalAlpha = 0.2;
                viewCtx.translate(view.offsetX, view.offsetY);
                viewCtx.scale(view.scale, view.scale);
                viewCtx.drawImage(prevFrame.modelCanvas, 0, 0);
                viewCtx.restore();
            }
            // Draw next frame
            if (currentFrameIndex < animationState.totalFrames - 1) {
                const nextFrame = layer.frames[currentFrameIndex + 1];
                viewCtx.save();
                viewCtx.globalAlpha = 0.2;
                viewCtx.translate(view.offsetX, view.offsetY);
                viewCtx.scale(view.scale, view.scale);
                viewCtx.drawImage(nextFrame.modelCanvas, 0, 0);
                viewCtx.restore();
            }
        }

        // --- Draw Current Frame ---
        const currentFrame = layer.frames[currentFrameIndex];
        if (currentFrame) {
            viewCtx.save();
            viewCtx.translate(view.offsetX, view.offsetY);
            viewCtx.scale(view.scale, view.scale);
            viewCtx.drawImage(currentFrame.modelCanvas, 0, 0);
            viewCtx.restore();
        }
    };

    function renderLayerList() {
        layerList.innerHTML = '';
        [...window.layers].reverse().forEach(layer => {
            const li = document.createElement('li');
            li.className = `layer-item ${layer.id === activeLayerId ? 'active' : ''} ${!layer.isVisible ? 'layer-hidden' : ''}`;
            li.dataset.layerId = layer.id;
            const layerName = document.createElement('span');
            layerName.textContent = layer.name;
            const controls = document.createElement('div');
            controls.className = 'layer-controls';
            const visibilityBtn = document.createElement('button');
            visibilityBtn.innerHTML = layer.isVisible ? '👁️' : '🙈';
            visibilityBtn.dataset.action = 'toggle-visibility';
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.dataset.action = 'delete';
            controls.appendChild(visibilityBtn);
            controls.appendChild(deleteBtn);
            li.appendChild(layerName);
            li.appendChild(controls);
            layerList.appendChild(li);
        });
    }
    function setActiveLayer(layerId) { activeLayerId = layerId; renderLayerList(); }

    function draw(e) {
        const ctx = getActiveModelContext();
        if (!isDrawing || !ctx) return;
        const modelX = (e.offsetX - view.offsetX) / view.scale;
        const modelY = (e.offsetY - view.offsetY) / view.scale;
        ctx.lineWidth = brushSize / view.scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = currentColor;
        ctx.globalCompositeOperation = (currentTool === 'eraser') ? 'destination-out' : 'source-over';
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(modelX, modelY);
        ctx.stroke();
        [lastX, lastY] = [modelX, modelY];
        redrawSingleLayer(getActiveLayer());
    }

    function drawFinalShape(e) {
        const ctx = getActiveModelContext();
        if (!ctx) return;
        const modelX = (e.offsetX - view.offsetX) / view.scale;
        const modelY = (e.offsetY - view.offsetY) / view.scale;
        ctx.lineWidth = brushSize / view.scale;
        ctx.strokeStyle = currentColor;
        ctx.globalCompositeOperation = 'source-over';
        ctx.beginPath();
        const width = modelX - shapeStartX;
        const height = modelY - shapeStartY;
        switch (currentTool) {
            case 'line': ctx.moveTo(shapeStartX, shapeStartY); ctx.lineTo(modelX, modelY); break;
            case 'rect': ctx.rect(shapeStartX, shapeStartY, width, height); break;
            case 'circle': const radius = Math.sqrt(width * width + height * height); ctx.arc(shapeStartX, shapeStartY, radius, 0, 2 * Math.PI); break;
        }
        ctx.stroke();
        redrawSingleLayer(getActiveLayer());
    }

    // --- EVENT LISTENERS ---
    canvasContainer.addEventListener('mousedown', (e) => {
        if (['pencil', 'eraser'].includes(currentTool)) {
            isDrawing = true;
            [lastX, lastY] = [(e.offsetX - view.offsetX) / view.scale, (e.offsetY - view.offsetY) / view.scale];
        } else {
            isDrawingShape = true;
            [shapeStartX, shapeStartY] = [(e.offsetX - view.offsetX) / view.scale, (e.offsetY - view.offsetY) / view.scale];
        }
        window.addEventListener('mouseup', handleMouseUp, { once: true });
    });

    function handleMouseUp(e) {
        if (isDrawingShape) {
            const rect = canvasContainer.getBoundingClientRect();
            const syntheticEvent = { offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
            drawFinalShape(syntheticEvent);
            isDrawingShape = false;
        }
        isDrawing = false;
    }

    canvasContainer.addEventListener('mousemove', (e) => {
        if (isDrawing) draw(e);
        // No preview for now
    });

    canvasContainer.addEventListener('mouseout', () => { if (isDrawing) isDrawing = false; });

    // --- TOOLBAR LISTENERS ---
    brushSizeSlider.addEventListener('input', (e) => brushSize = e.target.value);
    zoomInBtn.addEventListener('click', () => { view.scale *= 1.2; redrawAllLayers(); });
    zoomOutBtn.addEventListener('click', () => { view.scale /= 1.2; redrawAllLayers(); });
    zoomResetBtn.addEventListener('click', () => { view.scale = 1.0; view.offsetX = 0; view.offsetY = 0; redrawAllLayers(); });

    toolGroup.addEventListener('click', (e) => {
        const clickedTool = e.target.closest('.tool-button');
        if (clickedTool && clickedTool.dataset.tool) {
            currentTool = clickedTool.dataset.tool;
            toolGroup.querySelectorAll('.tool-button').forEach(btn => btn.classList.remove('active'));
            clickedTool.classList.add('active');
        }
    });

    colorPalette.addEventListener('click', (e) => {
        if (e.target.classList.contains('color-option')) {
            currentColor = e.target.dataset.color;
            document.querySelectorAll('.color-option').forEach(option => option.classList.remove('active'));
            e.target.classList.add('active');
        }
    });

    clearCanvasBtn.addEventListener('click', () => {
        const ctx = getActiveModelContext();
        if (ctx) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            redrawSingleLayer(getActiveLayer());
        }
    });

    // --- LAYER & SAVE/LOAD (needs updating) ---
    // The following functions need to be updated to handle the new frame-based data structure.
    addLayerBtn.addEventListener('click', () => createNewLayer());

    layerList.addEventListener('click', (e) => {
        const target = e.target;
        const layerItem = target.closest('.layer-item');
        if (!layerItem) return;
        const layerId = Number(layerItem.dataset.layerId);
        const action = target.dataset.action;
        if (action === 'delete') deleteLayer(layerId);
        else if (action === 'toggle-visibility') toggleLayerVisibility(layerId);
        else setActiveLayer(layerId);
    });

    function deleteLayer(layerId) {
        if (window.layers.length <= 1) return alert("No se puede eliminar la última capa.");
        const layerIdx = window.layers.findIndex(l => l.id === layerId);
        const [deletedLayer] = window.layers.splice(layerIdx, 1);
        deletedLayer.viewCanvas.remove();
        if (activeLayerId === layerId) {
            setActiveLayer(window.layers.length > 0 ? window.layers[window.layers.length - 1].id : null);
        }
        renderLayerList();
    }

    function toggleLayerVisibility(layerId) {
        const layer = window.layers.find(l => l.id === layerId);
        if (layer) {
            layer.isVisible = !layer.isVisible;
            redrawSingleLayer(layer);
            renderLayerList();
        }
    }

    window.serializarProyecto = function() {
        const projectData = {
            animationState: {
                totalFrames: animationState.totalFrames,
                fps: animationState.fps,
            },
            layers: window.layers.map(layer => ({
                name: layer.name,
                isVisible: layer.isVisible,
                frames: layer.frames.map(frame => frame.modelCanvas.toDataURL())
            }))
        };
        return JSON.stringify(projectData, null, 2);
    };

    window.cargarProyecto = async function(jsonString) {
        try {
            const projectData = JSON.parse(jsonString);
            if (!projectData.layers || !projectData.animationState) throw new Error("Invalid project file.");

            clearProject();

            animationState.totalFrames = projectData.animationState.totalFrames;
            animationState.fps = projectData.animationState.fps;

            await Promise.all(projectData.layers.map(async (layerData) => {
                const newLayer = createNewLayer(layerData.name, false);
                newLayer.isVisible = layerData.isVisible;

                await Promise.all(layerData.frames.map(async (frameData, frameIndex) => {
                    // createNewLayer already creates frames, so we just need to load data into them
                    const frame = newLayer.frames[frameIndex];
                    if (frame && frameData) {
                        await new Promise((resolve, reject) => {
                            const img = new Image();
                            img.onload = () => {
                                frame.modelCtx.drawImage(img, 0, 0);
                                resolve();
                            };
                            img.onerror = reject;
                            img.src = frameData;
                        });
                    }
                }));
            }));

            if (window.layers.length > 0) {
                setActiveLayer(window.layers[window.layers.length - 1].id);
            }
            redrawAllLayers();
            // In the next step, we will also render the timeline UI
            console.log("Animation project loaded successfully.");

        } catch (error) {
            console.error("Failed to load project:", error);
            alert("Could not load the project file.");
        }
    };

    function clearProject() {
        canvasContainer.innerHTML = '';
        layerList.innerHTML = '';
        window.layers = [];
        activeLayerId = null;
        nextLayerId = 1;
        animationState.currentFrame = 0;
        animationState.totalFrames = 1;
    }

    saveProjectBtn.addEventListener('click', async () => {
        if (window.showSaveFilePicker) {
            try {
                const fileHandle = await window.showSaveFilePicker({
                    types: [{ description: 'Carley Animation Files', accept: { 'application/json': ['.cea'] } }],
                });
                const writable = await fileHandle.createWritable();
                await writable.write(window.serializarProyecto());
                await writable.close();
            } catch (err) { console.error("Save failed (modern):", err); }
        } else {
            try {
                const blob = new Blob([window.serializarProyecto()], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'proyecto.cea';
                a.click();
                URL.revokeObjectURL(url);
            } catch (err) { console.error("Save failed (fallback):", err); }
        }
    });

    document.getElementById('open-project-btn').addEventListener('click', (e) => {
        if (window.showOpenFilePicker) {
            e.preventDefault();
            openWithModernAPI();
        }
    });

    async function openWithModernAPI() {
        try {
            const [fileHandle] = await window.showOpenFilePicker({
                types: [{ description: 'Carley Animation Files', accept: { 'application/json': ['.cea'] } }],
            });
            const file = await fileHandle.getFile();
            const contents = await file.text();
            await window.cargarProyecto(contents);
        } catch (err) { console.error("Open failed (modern):", err); }
    }

    openProjectInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => window.cargarProyecto(event.target.result);
        reader.onerror = () => alert("Failed to read file.");
        reader.readAsText(file);
    });

    // --- TIMELINE LOGIC ---

    function renderTimeline() {
        frameTrack.innerHTML = '';
        for (let i = 0; i < animationState.totalFrames; i++) {
            const thumb = document.createElement('div');
            thumb.className = 'frame-thumbnail';
            if (i === animationState.currentFrame) {
                thumb.classList.add('active');
            }
            thumb.dataset.frameIndex = i;

            const frameNumber = document.createElement('span');
            frameNumber.className = 'frame-number';
            frameNumber.textContent = i + 1;
            thumb.appendChild(frameNumber);

            // In a future step, we could draw a mini preview of the canvas here

            frameTrack.appendChild(thumb);
        }
    }

    function setCurrentFrame(index) {
        if (index < 0 || index >= animationState.totalFrames) return;
        animationState.currentFrame = index;
        renderTimeline();
        redrawAllLayers();
    }

    addFrameBtn.addEventListener('click', () => {
        animationState.totalFrames++;
        window.layers.forEach(layer => {
            const modelCanvas = document.createElement('canvas');
            modelCanvas.width = 800;
            modelCanvas.height = 600;
            layer.frames.push({ modelCanvas: modelCanvas, modelCtx: modelCanvas.getContext('2d') });
        });
        setCurrentFrame(animationState.totalFrames - 1);
    });

    deleteFrameBtn.addEventListener('click', () => {
        if (animationState.totalFrames <= 1) return alert("No se puede eliminar el único frame.");

        window.layers.forEach(layer => {
            layer.frames.splice(animationState.currentFrame, 1);
        });

        animationState.totalFrames--;
        // Adjust current frame if we deleted the last one
        if (animationState.currentFrame >= animationState.totalFrames) {
            animationState.currentFrame = animationState.totalFrames - 1;
        }
        setCurrentFrame(animationState.currentFrame);
    });

    duplicateFrameBtn.addEventListener('click', () => {
        animationState.totalFrames++;
        window.layers.forEach(layer => {
            const sourceCanvas = layer.frames[animationState.currentFrame].modelCanvas;
            const newCanvas = document.createElement('canvas');
            newCanvas.width = 800;
            newCanvas.height = 600;
            const newCtx = newCanvas.getContext('2d');
            newCtx.drawImage(sourceCanvas, 0, 0);
            // Insert the new frame after the current one
            layer.frames.splice(animationState.currentFrame + 1, 0, { modelCanvas: newCanvas, modelCtx: newCtx });
        });
        setCurrentFrame(animationState.currentFrame + 1);
    });

    frameTrack.addEventListener('click', (e) => {
        const thumb = e.target.closest('.frame-thumbnail');
        if (thumb && thumb.dataset.frameIndex) {
            setCurrentFrame(Number(thumb.dataset.frameIndex));
        }
    });

    fpsInput.addEventListener('input', () => {
        animationState.fps = Number(fpsInput.value);
        if (animationState.isPlaying) {
            stopPlayback();
            startPlayback();
        }
    });

    playBtn.addEventListener('click', startPlayback);
    stopBtn.addEventListener('click', stopPlayback);

    onionSkinBtn.addEventListener('click', () => {
        animationState.onionSkinning = !animationState.onionSkinning;
        onionSkinBtn.classList.toggle('active', animationState.onionSkinning);
        redrawAllLayers();
    });

    function startPlayback() {
        if (animationState.isPlaying) return;
        animationState.isPlaying = true;

        animationState.playbackInterval = setInterval(() => {
            let nextFrame = animationState.currentFrame + 1;
            if (nextFrame >= animationState.totalFrames) {
                nextFrame = 0; // Loop
            }
            setCurrentFrame(nextFrame);
        }, 1000 / animationState.fps);
    }

    function stopPlayback() {
        if (!animationState.isPlaying) return;
        animationState.isPlaying = false;
        clearInterval(animationState.playbackInterval);
        animationState.playbackInterval = null;
    }

    // --- INITIALIZATION ---
    function initialize() {
        createNewLayer("Fondo");
        const initialColor = document.querySelector('.color-option[data-color="#000000"]');
        if (initialColor) initialColor.classList.add('active');
        renderTimeline();
        console.log('Animation-ready app initialized.');
    }

    initialize();
});
