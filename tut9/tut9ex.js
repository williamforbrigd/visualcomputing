// https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html
// https://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html
// https://github.com/frenchtoast747/webgl-obj-loader
// https://github.com/aakshayy/toonshader-webgl/
// https://www.cs.cmu.edu/~kmcrane/Projects/ModelRepository/

// Shaders /////////////////////////////////////////////////////////////////////

// fragment shader source for the floor
const floorFragShaderSource = `
    precision highp float;
    varying lowp vec4 position; 

    void main(void) {
        vec4 p = position; 
        vec2 ab = .1*p.xz;
        vec3 A = .25 + .25*vec3(sin(ab.x), sin(ab.y), 1.);
        vec2 uv = floor(p.xz);
        vec3 B = .5 - .5*vec3(mod(uv.x + uv.y, 2.));
        gl_FragColor = vec4(mix(A, B, .5), 1.);
    }
`;

// basic shader ...............................................................
const basicVertShaderSource = `
    attribute vec4 vPosition;
    attribute vec4 vColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 position; 
    varying lowp vec4 color; 

    void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * vPosition;
        color = vec4(0.1, 0.1, 0.1, 1.0);
        position = vPosition; // needed in floor fragment shader
    } 
`;

// basic fragment shader
const basicFragShaderSource = `
    varying lowp vec4 color; 

    void main(void) {
        gl_FragColor = color; 
    }
`; 

// textured shader ...............................................................
const texturedVertShaderSource = `
    attribute vec3 vNormal;
    attribute vec3 vPosition;
    attribute vec2 aTextureCoord;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying highp vec2 vTextureCoord;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(vNormal + vPosition, 1.0);
      vTextureCoord = aTextureCoord;
    }
`;

const texturedFragShaderSource = `
    varying highp vec2 vTextureCoord;
    uniform sampler2D uSampler;

    void main(void) {
      highp vec2 tex2 = vec2(vTextureCoord.x, -vTextureCoord.y);
      gl_FragColor = texture2D(uSampler, tex2);
    }
`;

// phong shader ...............................................................
// Ex1: Implmenent Phong shading!
const phongVertexShaderSource = `
  // Ex1: Implmenent Phong shading

  attribute vec3 vPosition;
  attribute vec3 vNormal;

  uniform mat4 uProjectionMatrix, uModelViewMatrix;

  varying vec3 normalInterp; // the normal vector from the camera
  varying vec3 vertPos; // is the position of the camera

  void main(){
      gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(vPosition, 1.0);
      vec4 vertPos4 = uModelViewMatrix * vec4(vPosition, 1.0);
      vertPos = vec3(vertPos4) / vertPos4.w;
      normalInterp = vec3(uModelViewMatrix * vec4(vNormal, 0.0));
  }
  `;

const phongFragmentShaderSource = `
  precision mediump float; // set float to medium precision

  uniform vec3 lightPos;
          
  const vec3 ambientColor = vec3(0.4, 0., 0.4);
  const vec3 diffuseColor = vec3(0.6, 0., 0.6);
  const vec3 specColor = vec3(0.6, 0.6, 0.6);
          
  // geometry properties
  varying vec3 vertPos; // world xyz of fragment
  varying vec3 normalInterp; // normal of fragment

  void main(void) {
      vec3 normal = normalize(normalInterp);
      vec3 light = normalize(lightPos - vertPos);
      float lambert = max(0.0, dot(normal, light));
          
      // ambient term
      // I_a * k_a
      vec3 ambient = ambientColor; 

      // diffuse term
      // I_d * k_d (N L)
      vec3 diffuse = diffuseColor * lambert;

      //specular term
      // I_s * k_s *(R V)**alpha
      // R = 2*(N L)*N - L
      vec3 r = 2.0 * lambert * normal - light;
      vec3 viewPoint = normalize(-vertPos);
      vec3 specular = specColor * pow(max(0.0, dot(viewPoint, r)), 10.);

      // combine to find lit color
      vec3 litColor = ambient + diffuse + specular;
      
      gl_FragColor = vec4(litColor, 1.0);
  }
`;


// textured phong shader ...............................................................
// Ex1: Implmenent Phong shading with texture as color!
const phongTexVertexShaderSource = `
  precision mediump float; // set float to medium precision
  
  attribute vec3 vPosition;
  attribute vec3 vNormal;
  attribute vec2 vTextureCoord;

  uniform mat4 uProjectionMatrix, uModelViewMatrix;

  varying vec3 normalInterp;
  varying vec3 vertPos;
  varying vec2 texCoord;

  void main(){
      gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(vPosition, 1.0);
      vec4 vertPos4 = uModelViewMatrix * vec4(vPosition, 1.0);
      vertPos = vec3(vertPos4) / vertPos4.w;
      normalInterp = vec3(uModelViewMatrix * vec4(vNormal, 0.0));
      texCoord = vTextureCoord;
  }
  `;

const phongTexFragmentShaderSource = `
  precision mediump float; // set float to medium precision

  varying vec3 vertPos; // world xyz of fragment
  varying vec3 normalInterp; // normal of fragment
  varying vec2 texCoord;

  uniform vec3 lightPos;
  uniform sampler2D uSampler;
          
  const vec3 specColor = vec3(0.6, 0.6, 0.6);
              
  void main() {

      // look up texture
      highp vec2 tex2 = vec2(texCoord.x, -texCoord.y);
      vec4 texColor = texture2D(uSampler, tex2);

      // ambient term
      // I_a * k_a
      vec3 ambient = 0.2*texColor.rgb; 

      // diffuse term
      // I_d * k_d (N L)
      vec3 diffuseColor = texColor.rgb * 0.7;
      vec3 normal = normalize(normalInterp);
      vec3 light = normalize(lightPos - vertPos);
      float lambert = max(0.0, dot(normal, light));
      vec3 diffuse = diffuseColor * lambert; // diffuse term
      
      // specular term
      vec3 viewPoint = normalize(-vertPos); // is the eye matrix
      // R = 2*(N*L)*N-L
      vec3 r = 2.0 * lambert * normal - light; 
      //10 is the shineness constant
      vec3 specular = specColor * pow(max(0.0, dot(viewPoint, r)), 10.); 

      // combine to find lit color
      vec3 litColor = ambient + diffuse + specular; 
      
      gl_FragColor = vec4(litColor, 1.0);
  }
`;

// toon shader ...............................................................
// Ex2a: Implmenent Toon shading!
const toonVertexShaderSource = `
  precision mediump float; // set float to medium precision
  
  attribute vec3 vPosition;
  attribute vec3 vNormal;
  attribute vec2 vTextureCoord;

  uniform mat4 uProjectionMatrix, uModelViewMatrix;

  varying vec3 normalInterp;  
  varying vec3 vertPos;  
  varying vec2 texCoord;

  void main(){
      gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(vPosition, 1.0);
      vec4 vertPos4 = uModelViewMatrix * vec4(vPosition, 1.0);
      vertPos = vec3(vertPos4) / vertPos4.w;
      normalInterp = vec3(uModelViewMatrix * vec4(vNormal, 0.0));

      texCoord = vTextureCoord;
  }
  `;

const toonFragmentShaderSource = `
  precision mediump float; // set float to medium precision

  uniform vec3 lightPos; // = vec3(5, 10.0, 5);
  uniform sampler2D uSampler;

  varying vec3 normalInterp; // world xyz of fragment
  varying vec3 vertPos; // normal of fragment
  varying vec2 texCoord;
  
  const float diffuseTones = 4.;
  const float specularTones = 4.;

  void main(void) {
      
      // look up texture
      highp vec2 tex2 = vec2(texCoord.x, -texCoord.y);
      vec4 texColor = texture2D(uSampler, tex2);

      // ambient term
      vec3 ambient = 0.3*texColor.rgb; 

      // diffuse term
      vec3 diffuseColor = 0.7 * texColor.rgb;
      vec3 normal = normalize(normalInterp);
      vec3 light = normalize(lightPos - vertPos);
      float lambert = max(0.0, dot(normal, light));
      float tone = floor(lambert* diffuseTones);
      lambert = tone / diffuseTones;
      vec3 diffuse = diffuseColor * lambert;

      // specular term
      vec3 eye = normalize(-vertPos); // the viewPoint
      vec3 r = 2.0 * lambert * normal - light;
      float highlight = pow(max(0.0, dot(eye, r)), 4.0);
      tone = floor(highlight * specularTones);
      highlight = tone / specularTones;
      vec3 specular = diffuseColor * highlight;

      // combine to find lit color
      vec3 litColor = ambient + diffuse + specular; 
      
      gl_FragColor = vec4(litColor, 1.0);
      
  }
`;

// outline shader ...............................................................
// Ex2b: Implement outline shading!
const outlineVertShaderSource = `
    attribute vec3 vPosition;
    attribute vec3 vNormal;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    void main(void) {
        vec4 p = vec4(vPosition + 0.02 * normalize(vNormal), 1.0);
        gl_Position = uProjectionMatrix * uModelViewMatrix * p;
    } 
`;

// outline fragment shader
const outlineFragShaderSource = `
    void main(void) {
      gl_FragColor = vec4(0, 0, 0, 1); //because the border shall be black
    }
`; 

function setupShaderProgram(vertShaderSource, fragShaderSource) { 
    var vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, vertShaderSource);
    gl.compileShader(vertShader);
    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
        alert("Problem with vertex shader...");
        alert(gl.getShaderInfoLog(vertShader));
        return;
    }

    var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, fragShaderSource);
    gl.compileShader(fragShader);
    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
        alert("Problem with fragment shader...");
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

var canvas = document.getElementById('canvas');
canvas.width = document.body.clientWidth;
canvas.height = document.body.clientHeight;
var gl = canvas.getContext('webgl');

var textCanvas = document.getElementById("text");
textCanvas.width = document.body.clientWidth;
textCanvas.height = document.body.clientHeight;
var ctx = textCanvas.getContext("2d");

var basicShaderProgram = setupShaderProgram(basicVertShaderSource, basicFragShaderSource);
var textureShaderProgram = setupShaderProgram(texturedVertShaderSource, texturedFragShaderSource);
var floorShaderProgram = setupShaderProgram(basicVertShaderSource, floorFragShaderSource);
var phongShaderProgram = setupShaderProgram(phongVertexShaderSource, phongFragmentShaderSource);
var phongTexShaderProgram = setupShaderProgram(phongTexVertexShaderSource, phongTexFragmentShaderSource);
var toonShaderProgram = setupShaderProgram(toonVertexShaderSource, toonFragmentShaderSource);
var outlineShaderProgram = setupShaderProgram(outlineVertShaderSource, outlineFragShaderSource);
var shaderPrograms = [basicShaderProgram, textureShaderProgram, floorShaderProgram, phongShaderProgram, phongTexShaderProgram, toonShaderProgram, outlineShaderProgram];

function setPVM(P, V, M) { 
    let VM = mat4.create();
    mat4.multiply(VM, V, M);
    shaderPrograms.forEach(shaderProgram => {
        gl.useProgram(shaderProgram);
        const uProjectionMatrix = gl.getUniformLocation(shaderProgram, 'uProjectionMatrix');
        const uModelViewMatrix  = gl.getUniformLocation(shaderProgram, 'uModelViewMatrix');
        gl.uniformMatrix4fv(uProjectionMatrix, false, P);
        gl.uniformMatrix4fv(uModelViewMatrix, false, VM);
    });
} 

function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be download over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);

  const image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // Yes, it's a power of 2. Generate mips.
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       // No, it's not a power of 2. Turn of mips and set
       // wrapping to clamp to edge
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

////////////////////////////////////////////////////////////////////////////////

var globalTime = 0.;
var shouldRotate = false;

var camUp = [0., 1., 0.];
var camPos = [0, 3, -5];
var camDir = [0, 0, 1];
var lightPos = [5, 10.0, 5];

var objectPosition = [0., 3., 0.];
var objectRotation = [0., 0., 0.];
var activeShader = 'basic';

var isMousePressed = false;
var mouseButtonPressed = -1;
var mousePosLast = [0,0];
var keyPressed = new Map();

function mouseDown(event) {
  mouseButtonPressed = event.which;
  isMousePressed = true;
}

function mouseUp() {
  isMousePressed = false;
}

function mouseMoved(event){
  var x = [event.clientX/canvas.width, event.clientY/canvas.height];
  

  if(isMousePressed) {
    if(mouseButtonPressed == 1 && !event.shiftKey) {
      rotateCameraY(-(x[0] - mousePosLast[0])*2);
      rotateCameraX( (x[1] - mousePosLast[1])*2);
    }
    else if(mouseButtonPressed == 1 && event.shiftKey){
      objectRotation[1] += 2*(x[0] - mousePosLast[0]);
      objectRotation[0] -= 2*(x[1] - mousePosLast[1]);
    }
  }
  mousePosLast = x;
}

function moveCamera(dist, sideways) {
    var d = camDir.slice()
    if(sideways) {
        vec3.cross(d, camUp, d);
    }
    vec3.scale(d, d, dist);
    vec3.add(camPos, camPos, d);
}

function rotateCameraY(angle) {
    var origin = [0., 0., 0.];
    vec3.rotateY(camDir, camDir, origin, angle);
}

function rotateCameraX(angle) {
    var origin = [0., 0., 0.];
    vec3.rotateX(camDir, camDir, origin, angle);
}

function moveLight(d) {
    vec3.add(lightPos, lightPos, d);
}

function keyDown(event) {

  if(event.code == 'Space') {
      shouldRotate = !shouldRotate;
  }
  else if(event.code == 'Digit1') {
      activeShader = 'basic';
  }
  else if(event.code == 'Digit2') {
      activeShader = 'phong';
  }
  else if(event.code == 'Digit3') {
      activeShader = 'phongTextured';
  }
  else if(event.code == 'Digit4') {
      activeShader = 'toon';
  }
  else {
    keyPressed.set(event.code, true);
  }
}

function keyUp(event){
  keyPressed.set(event.code, false);
}

function processKeyPressed(){

  keyPressed.forEach(function(value, key){
    if(value){
      switch(key){
        case 'KeyW': moveCamera(0.1, false); break;
        case 'KeyS': moveCamera(-0.1, false); break;
        case 'KeyA': moveCamera(0.1, true); break;
        case 'KeyD': moveCamera(-0.1, true); break;
        case 'KeyE': rotateCameraY(0.02); break;
        case 'KeyQ': rotateCameraY(-0.02); break;
        case 'KeyI': moveLight([0, 0, 1]); break;
        case 'KeyK': moveLight([0, 0, -1]); break;
        case 'KeyL': moveLight([1, 0, 0]); break;
        case 'KeyJ': moveLight([-1, 0, 0]); break;
        case 'ArrowUp': objectPosition[2] += 0.1; break;
        case 'ArrowDown': objectPosition[2] -= 0.1; break;
        case 'ArrowLeft': objectPosition[0] += 0.1; break;
        case 'ArrowRight': objectPosition[0] -= 0.1; break;
      }
    }
  });

}

function getCameraMatrix() { 
    let eye = camPos;
    var d = [0., 0., 0.]
    vec3.add(d, camPos, camDir)
    let TR = mat4.create();
    mat4.targetTo(TR, eye, d, [0., 1., 0.])
    return TR; 
}

function getViewMatrix() { 
    let V = mat4.create();
    mat4.invert(V, getCameraMatrix()); 
    return V; 
}

function getProjectionMatrix() {
    const fieldOfView = 45. * Math.PI / 180.; // NOTE: In radians.
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    let P = mat4.create(); 
    mat4.perspective(P, fieldOfView, aspect, zNear, zFar);
    return P;
}

// let's construct the floor
let d = 50.;
const floor_vertices = [ d, 0., d,  -d, 0., d,  d, 0., -d, d, 0., -d, -d, 0., d, -d, 0., -d];
const floor_indices = [ 0, 1, 2, 3, 4, 5 ];

main();

function main() {

    // Load texture
    const texture = loadTexture(gl, 'spot/spot_texture.png');

    // load in the mesh
    var objStr = document.getElementById('cow.obj').innerHTML;
    var mesh = new OBJ.Mesh(objStr);
    OBJ.initMeshBuffers( gl, mesh );

    // compute normals per vertex ///////////////////////////////////////////////////////////////////////
    // let's make sure all the normals are zero
    for (var i = 0; i < mesh.vertices.length; i++) {
      mesh.vertexNormals[i] = 0;
    }

    // helper function to extract vertex position from array of vertices
    function vec3FromArray(vertices, index) {
      return vec3.fromValues(vertices[3*index+0], vertices[3*index+1], vertices[3*index+2]);
    }

    // go thru all triangles
    for (var i = 0; i < mesh.indices.length/3; i++) {
      // get vertices of this triangle
      var v0 = vec3FromArray(mesh.vertices, mesh.indices[3*i+0]);
      var v1 = vec3FromArray(mesh.vertices, mesh.indices[3*i+1]);
      var v2 = vec3FromArray(mesh.vertices, mesh.indices[3*i+2]);
      // compute edges `a` and `b`
      var a = vec3.create();
      vec3.subtract(a, v1, v0);
      var b = vec3.create();
      vec3.subtract(b, v2, v0);
      // normal is normalized cross product of edges
      var n = vec3.create();
      vec3.cross(n, a, b);
      vec3.normalize(n, n);
      // add normal to all vertex normals of this triangle
      for (var j = 0; j < 3; j++) {
        var vIndex = mesh.indices[3*i+j];
        for (var k = 0; k < 3; k++) {
          mesh.vertexNormals[3*vIndex+k] += n[k];
        }
      }
    }
    // since we've added normals of all triangles a vertex is connected to, 
    // we need to normalize the vertex normals
    for (var i = 0; i < mesh.vertexNormals.length/3; i++) {
      var n = vec3FromArray(mesh.vertexNormals, i);
      vec3.normalize(n, n);
      // and copy back to mesh normal array
      for (var k = 0; k < 3; k++) {
        mesh.vertexNormals[3*i+k] += n[k];
      }
    }

    loop(); 

    function loop() { 
        window.requestAnimationFrame(loop);
        if(shouldRotate)
            globalTime += .01; 
        processKeyPressed();
        draw();
    }; 

    function draw() { 
        getReadyToDraw();
        
        let P = getProjectionMatrix(); 
        let V = getViewMatrix(); 

        let M_floor = mat4.create(); // NOTE: Initializes to I.
        setPVM(P, V, M_floor);
        drawFloor();
        
        let M = mat4.create();
        mat4.translate(M, M, objectPosition);
        mat4.rotateX(M, M, objectRotation[0]);
        mat4.rotateY(M, M, objectRotation[1]);
        mat4.rotateZ(M, M, objectRotation[2]);
        mat4.rotateX(M, M, globalTime);
        mat4.rotateY(M, M, globalTime);
        mat4.rotateZ(M, M, globalTime);
        setPVM(P, V, M);
  
        if(activeShader == 'basic')
        {
            drawObject(mesh);
        }
        else if(activeShader == 'phong')
        {
          drawObjPhong(mesh);
        }
        else if(activeShader == 'phongTextured')
        {
          drawObjPhongTex(mesh);
        }
        else if(activeShader == 'toon')
        {
          drawObjOutline(mesh);
          // clear depth buffer so toon shader can draw over it
          gl.clear(gl.DEPTH_BUFFER_BIT); 
          drawObjToon(mesh);
        }

        // text to display which shader is used
        const lineHeight = 30;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.font = "bold 24px monospace ";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(activeShader, ctx.canvas.width/2-lineHeight, lineHeight);

        var controlText = [
          "controls:",
          "  choose shader: 1234",
          "  camera move  : WASD",
          "  camera rotate: leftclick + drag",
          "  object move  : arrows",
          "  object rotate: shift + leftclick + drag",
          "  auto-rotate  : space",
          "  move light   : IJKL",
        ];
        for (var i = 0; i < controlText.length; i++) {
          ctx.fillText(controlText[i], 0, (i+1)*lineHeight);
        }

        var infoText = [
          "light position:",
          "  "+lightPos,
        ];
        for (var i = 0; i < infoText.length; i++) {
          ctx.fillText(infoText[i], 0, (controlText.length+i+1)*lineHeight);
        }

    }; 

    function drawFloor() {
        gl.useProgram(floorShaderProgram);

        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floor_vertices), gl.STATIC_DRAW);
        const vPosition = gl.getAttribLocation(floorShaderProgram, "vPosition");
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    
    function verticesToShader(object, shaderProgram) {
      const vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.vertices), gl.STATIC_DRAW);
      const vPosition = gl.getAttribLocation(shaderProgram, "vPosition");
      gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vPosition); 
    }

    function normalsToShader(object, shaderProgram) {
      // Ex1: pass normal information to shader!
      console.log(object);
      console.log(shaderProgram);
      const normalBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.vertexNormals), gl.STATIC_DRAW);
      const aVertexNormal = gl.getAttribLocation(shaderProgram, "vNormal");
      gl.vertexAttribPointer(aVertexNormal, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(aVertexNormal);
    }

    function indicesToShader(object) {
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer); 
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(object.indices), gl.STATIC_DRAW); 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer); 
    }

    function textureToShader(object, shaderProgram) {
      const texBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.textures), gl.STATIC_DRAW);
      const texcoordLocation = gl.getAttribLocation(shaderProgram, "vTextureCoord");
      gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(texcoordLocation);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      var textureLocation = gl.getUniformLocation(shaderProgram, "uSampler")
      gl.uniform1i(textureLocation, 0);
    }

    function drawObject(object) { 
      gl.useProgram(basicShaderProgram);
      verticesToShader(object, basicShaderProgram);
      indicesToShader(object);
      gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_SHORT, 0);
    };

    function lightPosToShader(shaderProgram) {
      const uLightPos = gl.getUniformLocation(shaderProgram, 'lightPos');
      gl.uniform3fv(uLightPos, lightPos);
    }

    function drawObjToon(object) { 
        gl.useProgram(toonShaderProgram);
        verticesToShader(object, toonShaderProgram);
        normalsToShader(object, toonShaderProgram);
        textureToShader(object, toonShaderProgram);
        indicesToShader(object);
        lightPosToShader(toonShaderProgram);
        gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_SHORT, 0);
    };

    function drawObjOutline(object) { 
        gl.useProgram(outlineShaderProgram);
        verticesToShader(object, outlineShaderProgram);
        normalsToShader(object, outlineShaderProgram);
        indicesToShader(object);
        gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_SHORT, 0);
    };


    function drawObjPhong(object) { 
        gl.useProgram(phongShaderProgram);
        verticesToShader(object, phongShaderProgram);
        normalsToShader(object, phongShaderProgram);
        indicesToShader(object);
        lightPosToShader(phongShaderProgram);
        gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_SHORT, 0);
    };

    function drawObjPhongTex(object) { 
        gl.useProgram(phongTexShaderProgram);
        verticesToShader(object, phongTexShaderProgram);
        normalsToShader(object, phongTexShaderProgram);
        textureToShader(object, phongTexShaderProgram);
        indicesToShader(object);
        lightPosToShader(phongTexShaderProgram);
        gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_SHORT, 0);
    };

    function getReadyToDraw() { 
        gl.clearColor(0.2, 0.2, 0.2, 1.); // NOTE: This is the background color.
        gl.enable(gl.DEPTH_TEST);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    };

};

