window.addEventListener('load', () => {
    // --- DOM ELEMENTS ---
    const canvasContainer = document.getElementById('canvas-container');
    const colorPalette = document.getElementById('color-palette');
    const brushSizeSlider = document.getElementById('brush-size');
    const pencilTool = document.getElementById('pencil-tool');
    const eraserTool = document.getElementById('eraser-tool');
    const clearCanvasBtn = document.getElementById('clear-canvas');
    const addLayerBtn = document.getElementById('add-layer-btn');
    const layerList = document.getElementById('layer-list');
    const saveProjectBtn = document.getElementById('save-project-btn');
    const openProjectInput = document.getElementById('open-project-input');
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const zoomResetBtn = document.getElementById('zoom-reset-btn');

    // --- STATE MANAGEMENT ---
    window.layers = []; // Exposed for testing
    let activeLayerId = null;
    let nextLayerId = 1;

    const view = { scale: 1.0, offsetX: 0, offsetY: 0 };

    let isDrawing = false;
    let isDrawingShape = false;
    let lastX = 0;
    let lastY = 0;
    let shapeStartX = 0;
    let shapeStartY = 0;

    let brushSize = 5;
    let currentColor = '#000000';
    let currentTool = 'pencil'; // pencil, eraser, line, rect, circle

    // --- CORE FUNCTIONS ---

    function createNewLayer(name, setActive = true) {
        const layerId = nextLayerId++;

        // Each layer now has a "view" canvas (in the DOM) and a "model" canvas (in memory)
        const viewCanvas = document.createElement('canvas');
        viewCanvas.id = `layer-view-${layerId}`;
        viewCanvas.className = 'layer-canvas';
        viewCanvas.width = 800;
        viewCanvas.height = 600;
        canvasContainer.appendChild(viewCanvas);

        const modelCanvas = document.createElement('canvas');
        modelCanvas.width = 800;
        modelCanvas.height = 600;

        const newLayer = {
            id: layerId,
            name: name || `Capa ${layerId}`,
            viewCanvas: viewCanvas,
            viewCtx: viewCanvas.getContext('2d'),
            modelCanvas: modelCanvas,
            modelCtx: modelCanvas.getContext('2d'),
            isVisible: true
        };

        window.layers.push(newLayer);
        canvasContainer.insertBefore(viewCanvas, canvasContainer.firstChild);

        if (setActive) {
            setActiveLayer(layerId);
        }
        renderLayerList();

        console.log(`Layer ${layerId} created.`);
        return newLayer;
    }

    // New function to redraw all layers based on the current view state
    function redrawAllLayers() {
        window.layers.forEach(layer => {
            layer.viewCtx.clearRect(0, 0, layer.viewCanvas.width, layer.viewCanvas.height);
            if (layer.isVisible) {
                layer.viewCtx.save();
                layer.viewCtx.translate(view.offsetX, view.offsetY);
                layer.viewCtx.scale(view.scale, view.scale);
                layer.viewCtx.drawImage(layer.modelCanvas, 0, 0);
                layer.viewCtx.restore();
            }
        });
    }

    function renderLayerList() {
        layerList.innerHTML = '';
        [...layers].reverse().forEach(layer => {
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

    function getActiveLayer() {
        return window.layers.find(layer => layer.id === activeLayerId);
    }

    function setActiveLayer(layerId) {
        activeLayerId = layerId;
        renderLayerList();
    }

    // The main draw function now handles freehand drawing
    function draw(e) {
        if (!isDrawing) return;

        const activeLayer = getActiveLayer();
        if (!activeLayer || !activeLayer.isVisible) return;

        // Transform mouse coordinates to model coordinates
        const modelX = (e.offsetX - view.offsetX) / view.scale;
        const modelY = (e.offsetY - view.offsetY) / view.scale;

        const ctx = activeLayer.modelCtx;
        ctx.lineWidth = brushSize / view.scale; // Adjust brush size for zoom
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = currentColor;
        ctx.globalCompositeOperation = (currentTool === 'eraser') ? 'destination-out' : 'source-over';

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(modelX, modelY);
        ctx.stroke();

        [lastX, lastY] = [modelX, modelY];

        window.redrawSingleLayer(activeLayer);
    }

    function drawPreviewShape(e) {
        // OBSOLETE
        const modelX = (e.offsetX - view.offsetX) / view.scale;
        const modelY = (e.offsetY - view.offsetY) / view.scale;

        previewCtx.save();
        previewCtx.translate(view.offsetX, view.offsetY);
        previewCtx.scale(view.scale, view.scale);
        previewCtx.lineWidth = brushSize / view.scale;
        previewCtx.strokeStyle = currentColor;
        previewCtx.beginPath();

        const width = modelX - shapeStartX;
        const height = modelY - shapeStartY;

        switch (currentTool) {
            case 'line':
                previewCtx.moveTo(shapeStartX, shapeStartY);
                previewCtx.lineTo(modelX, modelY);
                break;
            case 'rect':
                previewCtx.rect(shapeStartX, shapeStartY, width, height);
                break;
            case 'circle':
                const radius = Math.sqrt(width * width + height * height);
                previewCtx.arc(shapeStartX, shapeStartY, radius, 0, 2 * Math.PI);
                break;
        }
        previewCtx.stroke();
        previewCtx.restore();
    }

    function drawFinalShape(e) {
        const activeLayer = getActiveLayer();
        if (!activeLayer) return;

        const modelX = (e.offsetX - view.offsetX) / view.scale;
        const modelY = (e.offsetY - view.offsetY) / view.scale;

        const ctx = activeLayer.modelCtx;
        ctx.lineWidth = brushSize / view.scale;
        ctx.strokeStyle = currentColor;
        ctx.globalCompositeOperation = 'source-over';
        ctx.beginPath();

        const width = modelX - shapeStartX;
        const height = modelY - shapeStartY;

        switch (currentTool) {
            case 'line':
                ctx.moveTo(shapeStartX, shapeStartY);
                ctx.lineTo(modelX, modelY);
                break;
            case 'rect':
                ctx.rect(shapeStartX, shapeStartY, width, height);
                break;
            case 'circle':
                const radius = Math.sqrt(width * width + height * height);
                ctx.arc(shapeStartX, shapeStartY, radius, 0, 2 * Math.PI);
                break;
        }
        ctx.stroke();

        window.redrawSingleLayer(activeLayer);
    }

    // New helper to redraw just one layer's view, for performance
    window.redrawSingleLayer = function(layer){
        if (!layer) return;
        layer.viewCtx.clearRect(0, 0, layer.viewCanvas.width, layer.viewCanvas.height);
        if (layer.isVisible) {
            layer.viewCtx.save();
            layer.viewCtx.translate(view.offsetX, view.offsetY);
            layer.viewCtx.scale(view.scale, view.scale);
            layer.viewCtx.drawImage(layer.modelCanvas, 0, 0);
            layer.viewCtx.restore();
        }
    }

    // --- EVENT LISTENERS ---

    canvasContainer.addEventListener('mousedown', (e) => {
        if (currentTool === 'pencil' || currentTool === 'eraser') {
            isDrawing = true;
            lastX = (e.offsetX - view.offsetX) / view.scale;
            lastY = (e.offsetY - view.offsetY) / view.scale;
        } else {
            isDrawingShape = true;
            shapeStartX = (e.offsetX - view.offsetX) / view.scale;
            shapeStartY = (e.offsetY - view.offsetY) / view.scale;
        }
    });

    canvasContainer.addEventListener('mousemove', (e) => {
        if (isDrawing) {
            draw(e);
        } else if (isDrawingShape) {
            // No preview for now to simplify debugging
        }
    });

    canvasContainer.addEventListener('mousedown', (e) => {
        if (currentTool === 'pencil' || currentTool === 'eraser') {
            isDrawing = true;
            lastX = (e.offsetX - view.offsetX) / view.scale;
            lastY = (e.offsetY - view.offsetY) / view.scale;
        } else {
            isDrawingShape = true;
            shapeStartX = (e.offsetX - view.offsetX) / view.scale;
            shapeStartY = (e.offsetY - view.offsetY) / view.scale;
        }

        // Add mouseup listener to the window to catch release anywhere
        window.addEventListener('mouseup', handleMouseUp, { once: true });
    });

    function handleMouseUp(e) {
        if (isDrawingShape) {
            // Need to get coordinates relative to the canvas, even if mouse is outside
            const rect = canvasContainer.getBoundingClientRect();
            const endX = e.clientX - rect.left;
            const endY = e.clientY - rect.top;

            // Create a synthetic event object with offsetX/Y for drawFinalShape
            const syntheticEvent = { offsetX: endX, offsetY: endY };
            drawFinalShape(syntheticEvent);
            isDrawingShape = false;
        }
        isDrawing = false;
    }

    canvasContainer.addEventListener('mousemove', (e) => {
        if (isDrawing) {
            draw(e);
        } else if (isDrawingShape) {
            // Preview logic would go here if re-enabled
        }
    });

    canvasContainer.addEventListener('mouseout', (e) => {
        // Only cancel freehand drawing on mouse out
        if (isDrawing) {
            isDrawing = false;
        }
    });

    // Toolbar Listeners
    brushSizeSlider.addEventListener('input', (e) => brushSize = e.target.value);

    zoomInBtn.addEventListener('click', () => {
        view.scale *= 1.2;
        redrawAllLayers();
    });

    zoomOutBtn.addEventListener('click', () => {
        view.scale /= 1.2;
        redrawAllLayers();
    });

    zoomResetBtn.addEventListener('click', () => {
        view.scale = 1.0;
        view.offsetX = 0;
        view.offsetY = 0;
        redrawAllLayers();
    });

    document.querySelector('.tool-group').addEventListener('click', (e) => {
        const clickedTool = e.target.closest('.tool-button');
        if (clickedTool && clickedTool.dataset.tool) {
            currentTool = clickedTool.dataset.tool;
            // Remove active class from all tool buttons
            document.querySelectorAll('.tool-group .tool-button').forEach(btn => btn.classList.remove('active'));
            // Add active class to the clicked one
            clickedTool.classList.add('active');
            console.log("Herramienta seleccionada:", currentTool);
        }
    });

    colorPalette.addEventListener('click', (e) => {
        if (e.target.classList.contains('color-option')) {
            currentColor = e.target.dataset.color;
            document.querySelectorAll('.color-option').forEach(option => option.classList.remove('active'));
            e.target.classList.add('active');
        }
    });

    // Clear button now clears the MODEL canvas
    clearCanvasBtn.addEventListener('click', () => {
        const activeLayer = getActiveLayer();
        if (activeLayer) {
            activeLayer.modelCtx.clearRect(0, 0, activeLayer.modelCanvas.width, activeLayer.modelCanvas.height);
            window.redrawSingleLayer(activeLayer); // Update the view
        }
    });

    // Layer Panel Listeners
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
            setActiveLayer(window.layers[window.layers.length - 1].id);
        }
        renderLayerList();
    }

    function toggleLayerVisibility(layerId) {
        const layer = window.layers.find(l => l.id === layerId);
        if (layer) {
            layer.isVisible = !layer.isVisible;
            window.redrawSingleLayer(layer); // Redraw to show/hide it
            renderLayerList();
        }
    }

    // --- CORE SAVE/LOAD LOGIC ---

    window.serializarProyecto = function() {
        const projectData = { layers: [] };
        window.layers.forEach(layer => {
            projectData.layers.push({
                name: layer.name,
                isVisible: layer.isVisible,
                imageData: layer.modelCanvas.toDataURL() // Save from the MODEL canvas
            });
        });
        return JSON.stringify(projectData, null, 2);
    };

    window.cargarProyecto = async function(jsonString) {
        try {
            const projectData = JSON.parse(jsonString);
            if (!projectData.layers || !Array.isArray(projectData.layers)) throw new Error("Invalid project file format.");
            clearProject();
            await Promise.all(projectData.layers.map(async (layerData) => {
                const newLayer = createNewLayer(layerData.name, false);
                newLayer.isVisible = layerData.isVisible;
                if (layerData.imageData) {
                    await new Promise((resolve, reject) => {
                        const img = new Image();
                        img.onload = () => {
                            newLayer.modelCtx.drawImage(img, 0, 0); // Load into MODEL canvas
                            resolve();
                        };
                        img.onerror = reject;
                        img.src = layerData.imageData;
                    });
                }
            }));
            if (window.layers.length > 0) {
                setActiveLayer(window.layers[window.layers.length - 1].id);
            }
            redrawAllLayers(); // Redraw all views after loading
            renderLayerList();
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
    }

    // --- EVENT LISTENERS (Save/Load) ---
    saveProjectBtn.addEventListener('click', async () => {
        if (window.showSaveFilePicker) {
            console.log("Usando la API moderna para guardar...");
            try {
                const fileHandle = await window.showSaveFilePicker({
                    types: [{
                        description: 'Carley Animation Files',
                        accept: { 'application/json': ['.cea'] },
                    }],
                });
                const writable = await fileHandle.createWritable();
                const projectJson = serializarProyecto();
                await writable.write(projectJson);
                await writable.close();
                console.log("Proyecto guardado exitosamente.");
            } catch (error) {
                console.error("Error al guardar (API moderna):", error);
            }
        } else {
            console.log("Usando el método tradicional para guardar...");
            try {
                const projectJson = serializarProyecto();
                const blob = new Blob([projectJson], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = 'proyecto.cea';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                console.log("Proyecto descargado.");
            } catch (error) {
                console.error("Error al guardar (tradicional):", error);
            }
        }
    });

    document.getElementById('open-project-btn').addEventListener('click', (e) => {
        if (window.showOpenFilePicker) {
            e.preventDefault();
            openWithModernAPI();
        }
    });

    async function openWithModernAPI() {
        console.log("Usando la API moderna para abrir...");
        try {
            const [fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: 'Carley Animation Files',
                    accept: { 'application/json': ['.cea'] },
                }],
            });
            const file = await fileHandle.getFile();
            const contents = await file.text();
            await cargarProyecto(contents);
        } catch (error) {
            console.error("Error al abrir (API moderna):", error);
        }
    }

    openProjectInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        console.log("Usando el método tradicional para abrir...");
        const reader = new FileReader();
        reader.onload = (event) => {
            const contents = event.target.result;
            cargarProyecto(contents);
        };
        reader.onerror = (error) => {
            console.error("Error al abrir (tradicional):", error);
            alert("No se pudo leer el archivo.");
        };
        reader.readAsText(file);
    });

    // --- INITIALIZATION ---
    function initialize() {
        createNewLayer("Fondo");
        const initialColor = document.querySelector('.color-option[data-color="#000000"]');
        if (initialColor) initialColor.classList.add('active');
        console.log('Shape-ready drawing app initialized.');
    }

    initialize();
});
