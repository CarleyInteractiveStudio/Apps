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

    // --- STATE MANAGEMENT ---
    window.layers = []; // Exposed for testing
    let activeLayerId = null;
    let nextLayerId = 1;

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    let brushSize = 5;
    let currentColor = '#000000';
    let currentTool = 'pencil'; // 'pencil' or 'eraser'

    // --- CORE FUNCTIONS ---
    function createNewLayer(name, setActive = true) {
        const layerId = nextLayerId++;

        const canvas = document.createElement('canvas');
        canvas.id = `layer-${layerId}`;
        canvas.className = 'layer-canvas';
        canvas.width = 800;
        canvas.height = 600;
        canvasContainer.appendChild(canvas);

        const ctx = canvas.getContext('2d');

        const newLayer = {
            id: layerId,
            name: name || `Capa ${layerId}`,
            canvas: canvas,
            ctx: ctx,
            isVisible: true
        };

        window.layers.push(newLayer);

        // The new layer should be added at the top of the stack visually
        canvasContainer.insertBefore(canvas, canvasContainer.firstChild);

        // Don't automatically activate when loading a project
        if (setActive) {
            setActiveLayer(layerId);
        }
        renderLayerList();

        console.log(`Layer ${layerId} created.`);
        return newLayer;
    }

    function renderLayerList() {
        layerList.innerHTML = ''; // Clear the list
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
        return layers.find(layer => layer.id === activeLayerId);
    }

    function setActiveLayer(layerId) {
        activeLayerId = layerId;
        renderLayerList();
        console.log(`Layer ${layerId} is now active.`);
    }

    function draw(e) {
        if (!isDrawing) return;

        const activeLayer = getActiveLayer();
        if (!activeLayer || !activeLayer.isVisible) return;

        const ctx = activeLayer.ctx;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = (currentTool === 'eraser') ? '#ffffff' : currentColor;

        // Eraser in a multi-layer setup should draw transparently, not white
        if (currentTool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
        } else {
            ctx.globalCompositeOperation = 'source-over';
        }

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();

        [lastX, lastY] = [e.offsetX, e.offsetY];
    }

    // --- EVENT LISTENERS ---

    // Drawing Listeners on the container
    canvasContainer.addEventListener('mousedown', (e) => {
        isDrawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
    });
    canvasContainer.addEventListener('mousemove', draw);
    canvasContainer.addEventListener('mouseup', () => isDrawing = false);
    canvasContainer.addEventListener('mouseout', () => isDrawing = false);

    // Toolbar Listeners
    brushSizeSlider.addEventListener('input', (e) => {
        brushSize = e.target.value;
    });

    colorPalette.addEventListener('click', (e) => {
        if (e.target.classList.contains('color-option')) {
            currentColor = e.target.dataset.color;
            document.querySelectorAll('.color-option').forEach(option => option.classList.remove('active'));
            e.target.classList.add('active');
            currentTool = 'pencil';
            pencilTool.classList.add('active');
            eraserTool.classList.remove('active');
        }
    });

    pencilTool.addEventListener('click', () => {
        currentTool = 'pencil';
        pencilTool.classList.add('active');
        eraserTool.classList.remove('active');
    });

    eraserTool.addEventListener('click', () => {
        currentTool = 'eraser';
        eraserTool.classList.add('active');
        pencilTool.classList.remove('active');
    });

    clearCanvasBtn.addEventListener('click', () => {
        const activeLayer = getActiveLayer();
        if (activeLayer) {
            activeLayer.ctx.clearRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
            console.log(`Layer ${activeLayer.id} cleared.`);
        }
    });

    // Layer Panel Listeners
    addLayerBtn.addEventListener('click', () => {
        createNewLayer();
    });

    layerList.addEventListener('click', (e) => {
        const target = e.target;
        const layerItem = target.closest('.layer-item');
        if (!layerItem) return;

        const layerId = Number(layerItem.dataset.layerId);
        const action = target.dataset.action;

        if (action === 'delete') {
            deleteLayer(layerId);
        } else if (action === 'toggle-visibility') {
            toggleLayerVisibility(layerId);
        } else {
            // If no action button was clicked, assume the user wants to select the layer
            setActiveLayer(layerId);
        }
    });

    function deleteLayer(layerId) {
        if (layers.length <= 1) {
            alert("No se puede eliminar la última capa.");
            return;
        }

        // Remove from DOM
        const canvasToRemove = document.getElementById(`layer-${layerId}`);
        if(canvasToRemove) canvasToRemove.remove();

        // Remove from state
        layers = layers.filter(layer => layer.id !== layerId);

        // If the active layer was deleted, set a new active layer
        if (activeLayerId === layerId) {
            setActiveLayer(layers[layers.length - 1].id);
        }

        renderLayerList();
        console.log(`Layer ${layerId} deleted.`);
    }

    function toggleLayerVisibility(layerId) {
        const layer = layers.find(l => l.id === layerId);
        if (layer) {
            layer.isVisible = !layer.isVisible;
            layer.canvas.style.display = layer.isVisible ? 'block' : 'none';
            renderLayerList();
            console.log(`Layer ${layerId} visibility set to ${layer.isVisible}`);
        }
    }

    // --- CORE SAVE/LOAD LOGIC ---

    window.serializarProyecto = function() {
        const projectData = {
            layers: [],
            // In the future, we could add other project-wide settings here
        };

        window.layers.forEach(layer => {
            projectData.layers.push({
                name: layer.name,
                isVisible: layer.isVisible,
                imageData: layer.canvas.toDataURL() // Export canvas as Base64 image
            });
        });

        return JSON.stringify(projectData, null, 2);
    }

    window.cargarProyecto = async function(jsonString) {
        try {
            const projectData = JSON.parse(jsonString);
            if (!projectData.layers || !Array.isArray(projectData.layers)) {
                throw new Error("El archivo no tiene el formato correcto.");
            }

            clearProject();

            // Use Promise.all to wait for all images to load before proceeding
            await Promise.all(projectData.layers.map(async (layerData, index) => {
                const newLayer = createNewLayer(layerData.name, false);
                newLayer.isVisible = layerData.isVisible;

                // Important: hide the canvas element if layer is not visible
                newLayer.canvas.style.display = newLayer.isVisible ? 'block' : 'none';

                if (layerData.imageData) {
                    await new Promise((resolve, reject) => {
                        const img = new Image();
                        img.onload = () => {
                            newLayer.ctx.drawImage(img, 0, 0);
                            resolve();
                        };
                        img.onerror = reject;
                        img.src = layerData.imageData;
                    });
                }
            }));

            // Set the top-most layer as active after loading
            if (window.layers.length > 0) {
                setActiveLayer(window.layers[window.layers.length - 1].id);
            }

            renderLayerList();
            console.log("Proyecto cargado exitosamente.");

        } catch (error) {
            console.error("Error al cargar el proyecto:", error);
            alert("No se pudo cargar el archivo. Puede que esté dañado o no sea un archivo de proyecto válido.");
        }
    }

    function clearProject() {
        // Clear DOM
        canvasContainer.innerHTML = '';
        layerList.innerHTML = '';
        // Clear state
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

    // The 'open' button is a label, so we listen on the label for the modern API
    // For the fallback, we listen on the hidden file input itself.
    document.getElementById('open-project-btn').addEventListener('click', (e) => {
        if (window.showOpenFilePicker) {
            e.preventDefault(); // Prevent the file input from opening
            openWithModernAPI();
        }
        // If the modern API is not present, this click will simply trigger the label's
        // default behavior, which is to open the 'for' linked input.
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
        if (!file) {
            return;
        }
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
        createNewLayer("Fondo"); // Create the first layer, e.g., "Background"

        // Set initial active color in UI
        const initialColor = document.querySelector('.color-option[data-color="#000000"]');
        if(initialColor) initialColor.classList.add('active');

        console.log('Layer-based drawing app initialized.');
    }

    initialize();
});
