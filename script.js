(function (swapnote) {
    'use strict';

    // Calculates a distance
    function calcDistance(x1, y1, x2, y2) {
        return Math.sqrt(((x2 - x1) * (x2 - x1)) + ((y2 - y1) * (y2 - y1)));
    }

    function compose(context) {
        var inkMeter = new swapnote.InkMeter(20000, 20000),
            colourPicker = new swapnote.ColourPicker(),
            canvas = new swapnote.Canvas(308, 168),
            previewCanvas = new swapnote.Canvas(308, 168);

        var previewArea, previewNote;
        previewArea = $({
            parentElement: context.topScreen,
            tagName: 'div',
            id: 'preview-area',
            children: [
                previewNote = $({
                    tagName: 'div',
                    className: 'preview-note',
                    children: [
                        $('Press (A) to play')
                    ]
                }),
                $({
                    tagName: 'div',
                    className: 'canvas-box',
                    children: [
                        $({
                            tagName: 'div',
                            className: 'canvas-frame',
                            children: [
                                previewCanvas.element
                            ]
                        })
                    ]
                }),
                $({
                    tagName: 'div',
                    className: 'preview-date',
                    children: [
                        $((new Date()).toDateString())
                    ]
                })
            ]
        });

        var colourButton, drawingArea, pageCounter, eraserButton, downButton, upButton;
        drawingArea = $({
            parentElement: context.bottomScreen,
            tagName: 'div',
            id: 'drawing-area',
            children: [
                $({
                    tagName: 'div',
                    className: 'canvas-box',
                    children: [
                        $({
                            tagName: 'div',
                            className: 'canvas-frame',
                            children: [
                                canvas.element
                            ]
                        })
                    ]
                }),
                $({
                    tagName: 'div',
                    id: 'tool-bar',
                    children: [
                        $({
                            tagName: 'button',
                            id: 'save-button',
                            children: [
                                $('Save')
                            ]
                        }),
                        $({
                            tagName: 'div',
                            id: 'colour-box',
                            children: [
                                colourButton = $({
                                    tagName: 'button',
                                    id: 'colour-button'
                                })
                            ],
                        }),
                        $({
                            tagName: 'div',
                            id: 'tool-box',
                            children: [
                                $({
                                    tagName: 'button',
                                    id: 'pencil-button'
                                }),
                                inkMeter.element,
                                eraserButton = $({
                                    tagName: 'button',
                                    id: 'eraser-button'
                                })
                            ]
                        }),
                        pageCounter = $({
                            tagName: 'div',
                            id: 'page-count',
                            children: [
                                $('p. 1/4')
                            ]
                        }),
                        upButton = $({
                            tagName: 'button',
                            id: 'up-button'
                        }),
                        downButton = $({
                            tagName: 'button',
                            id: 'down-button'
                        })
                    ]
                }),
                colourPicker.element
            ]
        });

        var pages = [[], [], [], []], pageInkUsage = [0, 0, 0, 0],
            page = 0, pageCount = 4, inkUsage = 0;
        var drawing = false, drawColour = 'black', lastX = 0, lastY = 0;

        canvas.element.onmousedown = function (e) {
            // Only allow drawing if we have enough ink
            if (!inkMeter.subtractInk(1)) {
                return;
            }

            // Amount of ink this page uses
            inkUsage += 1;

            // Begin a stroke
            drawing = true;
            canvas.beginStroke();
            previewCanvas.beginStroke();

            // Draw dot
            canvas.addDot(drawColour, e.layerX, e.layerY);
            previewCanvas.addDot(drawColour, e.layerX, e.layerY);

            // Store the position at present so that we know where next
            // segment will start
            lastX = e.layerX;
            lastY = e.layerY;
        };
        var onMove = canvas.element.onmousemove = function (e) {
            // Prevent mouse moving causing drawing on desktop
            // (Obviously, "mousemove" can't fire when not dragging on 3DS)
            if (drawing) {
                // The length of this segment will be subtracted from our "ink"
                var inkUsed = calcDistance(lastX, lastY, e.layerX, e.layerY);

                // Only allow drawing if we have enough ink
                if (!inkMeter.subtractInk(inkUsed)) {
                    return;
                }

                // Amount of ink this page uses
                inkUsage += inkUsed;

                // Draw line
                canvas.addLine(drawColour, lastX, lastY, e.layerX, e.layerY);
                previewCanvas.addLine(drawColour, lastX, lastY, e.layerX, e.layerY);
            }

            lastX = e.layerX;
            lastY = e.layerY;
        };
        canvas.element.onmouseup = function (e) {
            if (drawing) {
                onMove(e);

                // End of stroke
                canvas.endStroke();
                previewCanvas.endStroke();
                
                drawing = false;
            }
        };

        colourButton.onclick = function () {
            colourPicker.open(function (colour) {
                colourButton.style.backgroundColor = colour;
                drawColour = colour;
            });
        };

        eraserButton.onclick = function () {
            if (confirm("Clear this page?")) {
                canvas.clearStrokes();
                previewCanvas.clearStrokes();

                // Reset ink usage for this page
                inkMeter.addInk(inkUsage);
                inkUsage = 0;
            }
        };

        downButton.onclick = function () {
            // Limit no. of pages
            if (page + 1 < pageCount) {
                pages[page] = canvas.exportStrokes();
                pageInkUsage[page] = inkUsage;
                page++;

                pageCounter.innerHTML = '';
                pageCounter.appendChild($('p. ' + (page + 1) + '/' + pageCount));

                canvas.importStrokes(pages[page]);
                inkUsage = pageInkUsage[page];
                previewCanvas.importStrokes(pages[page]);
            }   
        };

        upButton.onclick = function () {
            if (page - 1 >= 0) {
                pages[page] = canvas.exportStrokes();
                pageInkUsage[page] = inkUsage;
                page--;

                pageCounter.innerHTML = '';
                pageCounter.appendChild($('p. ' + (page + 1) + '/' + pageCount));

                canvas.importStrokes(pages[page]);
                inkUsage = pageInkUsage[page];
                previewCanvas.importStrokes(pages[page]);
            }   
        };

        var cancelFunction = null;
        lib3DS.handleButtons(function (key) {
            if (key === 'A') {
                if (cancelFunction) {
                    cancelFunction();
                    cancelFunction = null;
                    previewNote.innerHTML = '';
                    previewNote.appendChild($('Press (A) to play'));

                    // Replay again (but instantly) so that preview is visible
                    previewCanvas.replay(true);
                } else {
                    cancelFunction = previewCanvas.replay(false, function () {
                        previewNote.innerHTML = '';
                        previewNote.appendChild($('Press (A) to play'));
                        cancelFunction = null;
                    });
                    previewNote.innerHTML = '';
                    previewNote.appendChild($('Press (A) to stop'));
                }
            }
        });
    }

    window.onerror = alert;
    window.onload = function () {
        var context = lib3DS.initModeDual320();
        compose(context);
    };
}(window.swapnote = window.swapnote || {}));