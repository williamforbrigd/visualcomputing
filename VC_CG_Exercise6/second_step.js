
var canvas = document.getElementById('canvas'); 
var gl = canvas.getContext('webgl'); 

function main() {
    
    draw();

    function draw() { 
        getReadyToDraw();
        drawTriangle();
    }; 

    function getReadyToDraw() { 
        gl.clearColor(0., 0., 0., 1.); // NOTE: This is the background color.
        gl.enable(gl.DEPTH_TEST);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    };

    function drawTriangle() { 

        let vertexPoistions = [
            0, 0, 
            1, 0, 
            0, 1
        ];

        let col = [
            1, 1, 1
        ];
        
        
        let vertexData = new Float32Array(vertexPoistions);
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
    }; 
};