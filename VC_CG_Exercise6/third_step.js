
const vertShaderSource = `
attribute vec3 aVertexPosition;
void main(void) {
   gl_Position = vec4(aVertexPosition, 1.);
}
`;

const fragShaderSource = `
precision highp float;
uniform vec3 uForegroundColor;
void main(void) {
   gl_FragColor = vec4(uForegroundColor, 1.);
}
`;

var canvas = document.getElementById('canvas'); 
var gl = canvas.getContext('webgl'); 

function main() {
    
    var shaderProgram = setupShaderProgram();

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

    function setupShaderProgram() { 
        var vertShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertShader, vertShaderSource);
        gl.compileShader(vertShader);
        if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(vertShader));
            return;
        }

        var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragShader, fragShaderSource);
        gl.compileShader(fragShader);
        if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(fragShader));
            return;
        }

        var shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertShader);
        gl.attachShader(shaderProgram, fragShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }

        gl.useProgram(shaderProgram);

        return shaderProgram;
    };
};