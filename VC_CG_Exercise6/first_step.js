var canvas = document.getElementById('canvas'); 
var gl = canvas.getContext('webgl'); 

function main() 
{
    gl.clearColor(0., 0., 0., 1.); 
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
};
