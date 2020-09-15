

var VertexShaderText =
[
"precision mediump float;",
"attribute vec3 vertPosition;",
"uniform mat4 u_ProjectionMatrix;",
"uniform mat4 u_ModelMatrix;",
"uniform mat4 u_ViewMatrix;",
"attribute vec4 a_Normal;",
"uniform mat4 u_NormalMatrix;",
"varying vec3 v_Normal;",
"varying vec3 v_Position;",
"attribute vec2 vertTextureCoords;",
"varying vec2 fragTextureCoords;",
"void main() {",
"	gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * vec4(vertPosition, 1.0);",
	// calculate vertex position in world space
"	v_Position = vec3(u_ModelMatrix * vec4(vertPosition, 1.0));",
"	v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));",
"	fragTextureCoords = vertTextureCoords;",
"}",
].join('\n')

var FragmentShaderText =
[
"precision mediump float;",
"uniform vec3 u_LightColor;",
"uniform vec3 u_LightPosition;",
"uniform vec3 u_AmbientLight;",
"varying vec3 v_Normal;",
"varying vec3 v_Position;",
"uniform vec3 normVis;",
"varying vec2 fragTextureCoords;",
"uniform sampler2D sampler;",
"void main() {",
"	highp vec4 texelColor = texture2D(sampler, fragTextureCoords);",
"	vec3 normal = normalize(v_Normal);",
"	vec3 lightDirection = normalize(u_LightPosition - v_Position);",
"	float nDotL = max(dot(lightDirection, normal), 0.0);",
"	vec3 diffuse = u_LightColor * nDotL;",
"	vec3 ambient = u_AmbientLight;",
//SPECULAR LIGHTING
"	float specularPower = 25.0;",
"	float specular = 0.0;",
"	if (nDotL > 0.0){",
"		vec3 viewVec = vec3(0,0,1.0);",
"		vec3 reflectVec = reflect(-lightDirection, normal);",
"		float specularFactor = max(dot(reflectVec, viewVec), 0.0);",
"		specular = pow(specularFactor, specularPower);",
"	}",
"	if(normVis[0] == 0.0)",
"		gl_FragColor = vec4(texelColor.rgb * (diffuse + ambient + specular), texelColor.a);",
//Visualise Normals
"	if(normVis[0] == 1.0)",
"		gl_FragColor = vec4(normal, 1.0);",
"}"
].join('\n')


var eye = [13.1, 10.8, 43]
var at = [13.1, 10.5, 42.1]
var up = [0, 1, 0]
var viewMatrix
var u_ViewMatrix
var u_ProjectionMatrix
var projectionMatrix
var canvas
var u_ModelMatrix
var modelMatrix
var gl
var n
var program
var u_NormalMatrix
var sunAngle
var currentAngleFlap = 0.0
function main() {
	//
	// Canvas establishment
	//
	canvas = document.getElementById('webgl')

	gl = canvas.getContext('webgl')

	//
	// Initialize Shaders
	//
	program = initShaders(gl)

	//
	// Create Texture 2/3
	//
	initTextureS(gl)
	initTexture2(gl)
	initTexture3(gl)
	initTexture(gl)
	initTextureFur(gl)

	//
	// Generate 3D world
	//
	generateWorld()

	//
	// Set canvas
	//
	gl.clearColor(0, 0, 0, 1.0)
	gl.enable(gl.DEPTH_TEST)
	gl.enable(gl.CULL_FACE)

	//
	// get modelviewmatrix
	//
	u_ModelMatrix = gl.getUniformLocation(program, 'u_ModelMatrix')
	u_ViewMatrix = gl.getUniformLocation(program, 'u_ViewMatrix')
	u_ProjectionMatrix = gl.getUniformLocation(program, 'u_ProjectionMatrix')

	//
	// set model view
	//
	modelMatrix = new Matrix4();
	viewMatrix = new Matrix4();
	projectionMatrix = new Matrix4();

	projectionMatrix.setPerspective(60.0, canvas.width / canvas.height, 1, 100);
  	gl.uniformMatrix4fv(u_ProjectionMatrix, false, projectionMatrix.elements);

  	//
  	// Lighting
  	//
  	u_NormalMatrix = gl.getUniformLocation(program, 'u_NormalMatrix');
	var u_LightColor = gl.getUniformLocation(program, 'u_LightColor');
	var u_LightPosition = gl.getUniformLocation(program, 'u_LightPosition');
	var u_AmbientLight = gl.getUniformLocation(program, 'u_AmbientLight');

	// ambient intensity
	gl.uniform3f(u_AmbientLight, 0.4, 0.4, 0.4);

	//
	// Normal Visualization
	//
	var u_normVis = gl.getUniformLocation(program, 'normVis')
	var normVis = document.getElementById("visualizeNormals")
	gl.uniform3f(u_normVis, 0.0, 0.0, 0.0)
	var butTick = 0
	normVis.onclick = function() {
		if (butTick == 0){
			console.log('in 0')
			gl.uniform3f(u_normVis, 1.0, 1.0, 1.0)
			butTick = 1
		}
		else{
			gl.uniform3f(u_normVis, 0.0, 0.0, 0.0)
			butTick = 0
			console.log('in 1')
		}
		console.log(butTick)
	}

	//
	// Turn Lighting Off
	//
	var lightCol1 = 0.8, lightCol2 = 0.8, lightCol3 = 0.8
	var lightOnOff = document.getElementById("lightOnOff")
	var lightOnOffTick = 0
	lightOnOff.onclick = function() {
		if(lightOnOffTick == 0){
			lightCol1 = 0
    		lightCol2 = 0
    		lightCol3 = 0
    		lightOnOffTick = 1
    	}
    	//On
    	else{
    		lightCol1 = 0.8
    		lightCol2 = 0.8
    		lightCol3 = 0.8
    		lightOnOffTick = 0
    	}
    	draw(gl, n, modelMatrix, u_ModelMatrix);
	}

  	//
  	// Key Movement
  	//
  	document.onkeydown = function(ev) {
  		keydown(ev, gl, n, viewMatrix, u_ViewMatrix)
  	}

  	//
  	// Mouse Movement (Drag)
  	//
  	var mouseDownFlag = false
  	canvas.onmousedown = function(ev){
  		//Cursor.lockState = CursorLockMode.Locked;
  		canvas.style.cursor = "none"
  		mouseDownFlag = !mouseDownFlag;

  		// if stepped out of movement 
  		if(!mouseDownFlag){
  			canvas.style.cursor = "auto"
  			firstMovement = true
  		}
	}

	canvas.onmouseleave = function() {
	  mouseDownFlag = false;
	  canvas.style.cursor = "auto"
  	  firstMovement = true
	}

	canvas.onmousemove = function(ev){
	  if (mouseDownFlag){
	    dragMove(ev)
	  }
	}

  	var currentAngle = 0.0
  	sunAngle = 0.0
  	var tick = function() {
  		currentAngle = animate(currentAngle)
  		sunAngle = sunAnimate(sunAngle)
  		currentAngleFlap = aniFlap(currentAngleFlap)
  		gl.uniform3f(u_LightPosition, sunAngle, 10.0, 18.0);

  		// when light is off then the color is black
  		gl.uniform3f(u_LightColor, lightCol1, lightCol2, lightCol3);

		draw(gl, n, modelMatrix, u_ModelMatrix, currentAngle)

		requestAnimationFrame(tick, canvas)
  	}

	tick();
}

var ANGLE_STEP = 10
var g_last = Date.now();
var lastFrame = 0.0
var deltaTime = 0.0
var elapsed
function animate(angle) {
  // Calculate movement speed
  var currentFrame = Date.now()
  deltaTime = currentFrame - lastFrame
  lastFrame = currentFrame
  // Calculate the elapsed time
  var now = Date.now();
  elapsed = now - g_last;
  g_last = now;
  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = angle + (ANGLE_STEP * elapsed) / 100.0;
  return newAngle %= 360;
}

var tickTime = -100;
function sunAnimate(angle) {
	tickTime += .25; 
	if (tickTime == 201){}
	if (tickTime > 100 && tickTime < 200){
		return (100 - (tickTime % 100));
	}
	else if (tickTime == 200){
		return 0;
	}
	else if (tickTime > 200 && tickTime != 300){
		return (0 - (tickTime % 100));
	}
	else if (tickTime == 300){
		tickTime = -100;
		return tickTime;
	}
	else{
		return tickTime;
	}
}

// Wing animation
var tickTime2 = -22;
function aniFlap(angle) {
  
  tickTime2 += 1; 

  if (tickTime2 > 22 && tickTime2 < 44){
    return (22 - (tickTime2 % 22));
  }
  else if (tickTime2 == 44){
    return 0;
  }
  else if (tickTime2 > 44 && tickTime2 != 66){
    return (0 - (tickTime2 % 22));
  }
  else if (tickTime2 == 66){
    tickTime2 = -22;
    return tickTime2;
  }
  else{
    return tickTime2;
  }	
}

function initShaders(gl){
	var VertexShader = gl.createShader(gl.VERTEX_SHADER)
	var FragmentShader = gl.createShader(gl.FRAGMENT_SHADER)

	gl.shaderSource(VertexShader, VertexShaderText)
	gl.shaderSource(FragmentShader, FragmentShaderText)

	gl.compileShader(VertexShader)
	if (!gl.getShaderParameter(VertexShader, gl.COMPILE_STATUS)) {
		console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(VertexShader));
		return;
	}

	gl.compileShader(FragmentShader)
	if (!gl.getShaderParameter(FragmentShader, gl.COMPILE_STATUS)) {
		console.error('ERROR compiling Fragment shader!', gl.getShaderInfoLog(FragmentShader))
		return;
	}

	var prog = gl.createProgram()

	gl.attachShader(prog, VertexShader)
	gl.attachShader(prog, FragmentShader)

	gl.linkProgram(prog)
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
		console.error('ERROR linking program!', gl.getProgramInfoLog(prog));
		return;
	}

	gl.validateProgram(prog)
	if (!gl.getProgramParameter(prog, gl.VALIDATE_STATUS)) {
		console.error('ERROR validating program!', gl.getProgramInfoLog(prog));
		return;
	}

	gl.useProgram(prog)

	return prog
}

function initBuffer(gl, program){
	
	var boxVertices = 
	[ // X, Y, Z           U, V
		// Top
		-0.5, 0.5, -0.5,   0, 0,
		-0.5, 0.5, 0.5,    0, 1,
		0.5, 0.5, 0.5,     1, 1,
		0.5, 0.5, -0.5,    1, 0,

		// Left
		-0.5, 0.5, 0.5,    0, 0,
		-0.5, -0.5, 0.5,   1, 0,
		-0.5, -0.5, -0.5,  1, 1,
		-0.5, 0.5, -0.5,   0, 1,

		// Right
		0.5, 0.5, 0.5,    1, 1,
		0.5, -0.5, 0.5,   0, 1,
		0.5, -0.5, -0.5,  0, 0,
		0.5, 0.5, -0.5,   1, 0,

		// Front
		0.5, 0.5, 0.5,    1, 1,
		0.5, -0.5, 0.5,   1, 0,
		-0.5, -0.5, 0.5,    0, 0,
		-0.5, 0.5, 0.5,    0, 1,

		// Back
		0.5, 0.5, -0.5,    0, 0,
		0.5, -0.5, -0.5,    0, 1,
		-0.5, -0.5, -0.5,    1, 1,
		-0.5, 0.5, -0.5,    1, 0,

		// Bottom
		-0.5, -0.5, -0.5,   1, 1,
		-0.5, -0.5, 0.5,    1, 0,
		0.5, -0.5, 0.5,     0, 0,
		0.5, -0.5, -0.5,    0, 1,
	];

	  // Normal
	var normals = new Float32Array([
		0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
		1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
		0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
		-1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
		0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
		0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
	]);

	var boxIndices =
	[
		// Top
		0, 1, 2,
		0, 2, 3,

		// Left
		5, 4, 6,
		6, 4, 7,

		// Right
		8, 9, 10,
		8, 10, 11,

		// Front
		13, 12, 14,
		15, 14, 12,

		// Back
		16, 17, 18,
		16, 18, 19,

		// Bottom
		21, 20, 22,
		22, 20, 23
	];

	//INITIALIZE NORMALS BUFFER
	var normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
	var a_Normal = gl.getAttribLocation(program, 'a_Normal');
	gl.vertexAttribPointer(
		a_Normal,
		3,
		gl.FLOAT,
		gl.FALSE,
		0,
		0);
	gl.enableVertexAttribArray(a_Normal);

	// rest of buffers
	var boxIndexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBufferObject);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(boxIndices), gl.STATIC_DRAW);

	var boxVertexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBufferObject);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boxVertices), gl.STATIC_DRAW);

	var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
	var textCoordAttributeLocation = gl.getAttribLocation(program, 'vertTextureCoords');
	
	gl.vertexAttribPointer(
		positionAttribLocation, // Attribute location
		3, // Number of elements per attribute
		gl.FLOAT, // Type of elements
		gl.FALSE,
		5 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
		0 // Offset from the beginning of a single vertex to this attribute
	);

	gl.vertexAttribPointer(
		textCoordAttributeLocation, // Attribute location
		2, // Number of elements per attribute
		gl.FLOAT, // Type of elements
		gl.FALSE,
		5 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
		3 * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute
	);

	gl.enableVertexAttribArray(positionAttribLocation);
	gl.enableVertexAttribArray(textCoordAttributeLocation);
	

	return boxIndices.length;
}

function initBuffersSphere(gl, program) { // Create a sphere
  var SPHERE_DIV = 13;

  var i, ai, si, ci;
  var j, aj, sj, cj;
  var p1, p2;

  var positions = [];
  var indices = [];

  // Generate coordinates
  for (j = 0; j <= SPHERE_DIV; j++) {
    aj = j * Math.PI / SPHERE_DIV;
    sj = Math.sin(aj);
    cj = Math.cos(aj);
    for (i = 0; i <= SPHERE_DIV; i++) {
      ai = i * 2 * Math.PI / SPHERE_DIV;
      si = Math.sin(ai);
      ci = Math.cos(ai);

      positions.push(si * sj);  // X
      positions.push(cj);       // Y
      positions.push(ci * sj);  // Z
    }
  }

  // Generate indices
  for (j = 0; j < SPHERE_DIV; j++) {
    for (i = 0; i < SPHERE_DIV; i++) {
      p1 = j * (SPHERE_DIV+1) + i;
      p2 = p1 + (SPHERE_DIV+1);

      indices.push(p1);
      indices.push(p2);
      indices.push(p1 + 1);

      indices.push(p1 + 1);
      indices.push(p2);
      indices.push(p2 + 1);
    }
  }

  	// INITIALIZE NORMAL BUFFER
  	var normalBuffer = gl.createBuffer()
  	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
  	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  	var a_Normal = gl.getAttribLocation(program, 'a_Normal')
  	gl.vertexAttribPointer(
  		a_Normal,
  		3,
  		gl.FLOAT,
  		gl.FALSE,
  		0,
  		0)
  	gl.enableVertexAttribArray(a_Normal)

  	// INITIALIZE VERTICES BUFFER
	var sphereVertices = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertices);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
	var vertPosition = gl.getAttribLocation(program, 'vertPosition');

	gl.vertexAttribPointer(
		vertPosition,
		3,
		gl.FLOAT, // Type of elements
		gl.FALSE,
		0,
		0)

	gl.enableVertexAttribArray(vertPosition)
	gl.bindBuffer(gl.ARRAY_BUFFER, null)

	gl.bindBuffer(gl.ARRAY_BUFFER, null)

	var sphereIndices = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIndices);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  return indices.length;
}

var cubeTexture2;	// diamond
function initTexture2(gl) {
	cubeTexture2 = gl.createTexture()
	gl.bindTexture(gl.TEXTURE_2D, cubeTexture2)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	
	// specify what info the texture will use
	gl.texImage2D(
		gl.TEXTURE_2D, 
		0,
		gl.RGBA,
		gl.RGBA,
		gl.UNSIGNED_BYTE,
		document.getElementById('diamond-img')
		)

	gl.bindTexture(gl.TEXTURE_2D, null)

}

var cubeTexture;	// diamond
function initTextureS(gl) {
	cubeTexture = gl.createTexture()
	gl.bindTexture(gl.TEXTURE_2D, cubeTexture)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	
	// specify what info the texture will use
	gl.texImage2D(
		gl.TEXTURE_2D, 
		0,
		gl.RGBA,
		gl.RGBA,
		gl.UNSIGNED_BYTE,
		document.getElementById('pstG-img')
		)

	gl.bindTexture(gl.TEXTURE_2D, null)

}

var cubeTexture4;	// diamond
function initTexture(gl) {
	cubeTexture4 = gl.createTexture()
	gl.bindTexture(gl.TEXTURE_2D, cubeTexture4)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	
	// specify what info the texture will use
	gl.texImage2D(
		gl.TEXTURE_2D, 
		0,
		gl.RGBA,
		gl.RGBA,
		gl.UNSIGNED_BYTE,
		document.getElementById('lamp-img')
		)

	gl.bindTexture(gl.TEXTURE_2D, null)

}

var cubeTexture3;	// diamond
function initTexture3(gl) {
	cubeTexture3 = gl.createTexture()
	gl.bindTexture(gl.TEXTURE_2D, cubeTexture3)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	
	// specify what info the texture will use
	gl.texImage2D(
		gl.TEXTURE_2D, 
		0,
		gl.RGBA,
		gl.RGBA,
		gl.UNSIGNED_BYTE,
		document.getElementById('grass-img')
		)

	gl.bindTexture(gl.TEXTURE_2D, null)

}

var cubeTextureFur;	// Fur
function initTextureFur(gl) {
	cubeTextureFur = gl.createTexture()
	gl.bindTexture(gl.TEXTURE_2D, cubeTextureFur)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	
	// specify what info the texture will use
	gl.texImage2D(
		gl.TEXTURE_2D, 
		0,
		gl.RGBA,
		gl.RGBA,
		gl.UNSIGNED_BYTE,
		document.getElementById('fur-img')
		)

	gl.bindTexture(gl.TEXTURE_2D, null)

}

function draw(gl, n, modelMatrix, u_ModelMatrix, currentAngle){
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

	viewMatrix.setLookAt(eye[0], eye[1], eye[2], at[0], at[1], at[2], up[0], up[1], up[2]);
	gl.uniformMatrix4fv(u_ViewMatrix, gl.FALSE, viewMatrix.elements);

	// Draw Cubes
	n = initBuffer(gl, program)
	pushMatrix(modelMatrix)

	for(var i = 0; i < worldArray.length; i++){
		for(var j = 0; j < worldArray[i].length; j++){
			
			if(worldArray[i][j] == 1 || worldArray[i][j] == 0){
				modelMatrix = popMatrix()
				pushMatrix(modelMatrix)

				modelMatrix.translate(i, 0, j)
				
				drawCube(gl, n, u_ModelMatrix, modelMatrix, cubeTexture3);
			}
			else if(worldArray[i][j] == 2){
				modelMatrix = popMatrix()
				pushMatrix(modelMatrix)

				modelMatrix.translate(i, 0, j)
				
				drawCube(gl, n, u_ModelMatrix, modelMatrix, cubeTexture3);

				modelMatrix.translate(0, 1, 0)
				drawCube(gl, n, u_ModelMatrix, modelMatrix, cubeTexture2);
			}
			else if (worldArray[i][j] == 3){
				modelMatrix = popMatrix()
				pushMatrix(modelMatrix)

				modelMatrix.translate(i, 0, j)
				drawCube(gl, n, u_ModelMatrix, modelMatrix, cubeTexture3);

				//modelMatrix.translate(i, 0, j)
				modelMatrix.translate(0, 1, 0)

				drawCube(gl, n, u_ModelMatrix, modelMatrix, cubeTexture2);

				modelMatrix.translate(0, 1, 0)

				drawCube(gl, n, u_ModelMatrix, modelMatrix, cubeTexture2);
			}
		}
	}

	modelMatrix = popMatrix()
	pushMatrix(modelMatrix)
	modelMatrix.translate(12, 4, 14)
	modelMatrix.rotate(currentAngle, 1, 0, 1)
	drawCube(gl, n, u_ModelMatrix, modelMatrix, cubeTexture4);
	
	// ANIMAL
	drawAnimal(gl, n, modelMatrix, u_ModelMatrix, currentAngle)

	// SPHERES
	modelMatrix = popMatrix()
	// Draw Spheres
	n = initBuffersSphere(gl, program)
	modelMatrix.translate(12, 4, 18)
	drawCube(gl, n, u_ModelMatrix, modelMatrix, cubeTexture)

	modelMatrix.translate(7, 0, 0)
	modelMatrix.rotate(currentAngle, 0, 1, 0)
	drawCube(gl, n, u_ModelMatrix, modelMatrix, cubeTexture)
}

function drawAnimal(gl, n, modelMatrix, u_ModelMatrix, currentAngle){
	modelMatrix = popMatrix()
	pushMatrix(modelMatrix)	// (1)

	//BODY
	modelMatrix.setTranslate(8, 6, 30)
	modelMatrix.rotate(sunAngle, 0, 1, 0)
	modelMatrix.scale(1, 2, 1)
	drawCube(gl, n, u_ModelMatrix, modelMatrix, cubeTextureFur);

	pushMatrix(modelMatrix) // (2)

	//
	// Head
	//
	modelMatrix.translate(0, 0.65, 0)
	modelMatrix.scale(0.5, 0.3, 0.5)
	modelMatrix.rotate(sunAngle, 0, 1, 0)
	drawCube(gl, n, u_ModelMatrix, modelMatrix, cubeTextureFur);

	//
	// EARS
	//
	modelMatrix.translate(0.4, 0.62, 0)
	modelMatrix.scale(0.2, 0.3, 0.5)
	drawCube(gl, n, u_ModelMatrix, modelMatrix, cubeTextureFur);

	modelMatrix.translate(-4, 0, 0)
	drawCube(gl, n, u_ModelMatrix, modelMatrix, cubeTextureFur);	

	//
	// Wing right
	//
	modelMatrix = popMatrix() // (2)
	pushMatrix(modelMatrix)
	modelMatrix.translate(0.9, 0.3, 0)
	modelMatrix.rotate(currentAngleFlap, 0, 1, 0)
	modelMatrix.scale(1.3, 0.2, 0.3)
	drawCube(gl, n, u_ModelMatrix, modelMatrix, cubeTextureFur);
	pushMatrix(modelMatrix) // far wing right

	modelMatrix.translate(0, -2, 0)
	modelMatrix.scale(1, 3, 0.5)
	drawCube(gl, n, u_ModelMatrix, modelMatrix, cubeTextureFur);

	//
	// Far wing right
	//
	modelMatrix = popMatrix()
	modelMatrix.translate(0.6, 0, 0)
	modelMatrix.rotate(currentAngleFlap, 0, 1, 0)
	modelMatrix.scale(0.5, 0.6, 0.6)
	drawCube(gl, n, u_ModelMatrix, modelMatrix, cubeTextureFur);

	modelMatrix.translate(0, -2, 0)
	modelMatrix.scale(1, 3, 0.5)
	drawCube(gl, n, u_ModelMatrix, modelMatrix, cubeTextureFur);

	//
	// Wing Left
	//
	modelMatrix = popMatrix()
	pushMatrix(modelMatrix)
	modelMatrix.translate(-0.9, 0.3, 0)
	modelMatrix.rotate(currentAngleFlap, 0, -1, 0)
	modelMatrix.scale(1.3, 0.2, 0.3)
	drawCube(gl, n, u_ModelMatrix, modelMatrix, cubeTextureFur);
	pushMatrix(modelMatrix)

	modelMatrix.translate(0, -2, 0)
	modelMatrix.scale(1, 3, 0.5)
	drawCube(gl, n, u_ModelMatrix, modelMatrix, cubeTextureFur);

	//
	// Far wing left
	//
	modelMatrix = popMatrix()
	modelMatrix.translate(-0.6, 0, 0)
	modelMatrix.rotate(currentAngleFlap, 0, -1, 0)
	modelMatrix.scale(0.5, 0.6, 0.6)
	drawCube(gl, n, u_ModelMatrix, modelMatrix, cubeTextureFur);

	modelMatrix.translate(0, -2, 0)
	modelMatrix.scale(1, 3, 0.5)
	drawCube(gl, n, u_ModelMatrix, modelMatrix, cubeTextureFur);

	//
	// Feet
	//
	modelMatrix = popMatrix()
	pushMatrix(modelMatrix)
	modelMatrix.translate(0.3, -0.6, 0)
	modelMatrix.scale(0.2, 0.2, 0.3)
	drawCube(gl, n, u_ModelMatrix, modelMatrix, cubeTextureFur);

	modelMatrix.translate(-3, 0, 0)
	modelMatrix.scale(1, 1, 1)
	drawCube(gl, n, u_ModelMatrix, modelMatrix, cubeTextureFur);


	modelMatrix = popMatrix() // (1)
}

function drawCube(gl, n, u_ModelMatrix, modelMatrix, cubeTextureParam){

	gl.uniformMatrix4fv(u_ModelMatrix, gl.FALSE, modelMatrix.elements)

	gl.clearColor(0,0,0, 1.0)

	gl.bindTexture(gl.TEXTURE_2D, cubeTextureParam)
	gl.activeTexture(gl.TEXTURE0)

	// set normal lights
	var normalMatrix = new Matrix4()
	normalMatrix.setInverseOf(modelMatrix)
	normalMatrix.transpose()
	gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements)

	gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0)
}

//
// Matrix stack data structure
//
var g_matrixStack = [];
function pushMatrix(m) { 
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix() {
  return g_matrixStack.pop();
}

var position = [eye[0], eye[1], eye[2]]
var rotation = [0, 0, 0]
var up = [0, 1, 0]
var step = 0.4
var step2 = 0.8
var normed = [0, 0, 0]
function keydown(ev, gl, n, viewMatrix, u_ViewMatrix) {
  switch (ev.keyCode) {
    case 68: // d move right
      forward = [at[0] - eye[0], at[1] - eye[1], at[2] - eye[2]]
      forwardVec = new Vector3(forward);
      forwardVec.normalize();

      right = crossProduct(forwardVec.elements, up);
      rightVec = new Vector3(right);
      rightVec.normalize();
      
      eye[0] += rightVec.elements[0] * (deltaTime/30)
      eye[1] += rightVec.elements[1] * (deltaTime/30)
      eye[2] += rightVec.elements[2] * (deltaTime/30)

      // update lookAt point
      at[0] += rightVec.elements[0] * (deltaTime/30)
      at[1] += rightVec.elements[1] * (deltaTime/30)
      at[2] += rightVec.elements[2] * (deltaTime/30)
      break;
    case 65: // a move left
      forward = [at[0] - eye[0], at[1] - eye[1], at[2] - eye[2]]
      forwardVec = new Vector3(forward);
      forwardVec.normalize();

      right = crossProduct(forwardVec.elements, up);
      rightVec = new Vector3(right);
      rightVec.normalize();
      
      eye[0] -= rightVec.elements[0] * (deltaTime/30)
      eye[1] -= rightVec.elements[1] * (deltaTime/30)
      eye[2] -= rightVec.elements[2] * (deltaTime/30)

      // update lookAt point
      at[0] -= rightVec.elements[0] * (deltaTime/30)
      at[1] -= rightVec.elements[1] * (deltaTime/30)
      at[2] -= rightVec.elements[2] * (deltaTime/30)
      break;
    case 38: //up arrow key
      direction = [at[0] - eye[0], at[1] - eye[1], at[2] - eye[2]]
      eye[1] += step
      at[1] += step
      break;
    case 40: // down arrow key
      direction = [at[0] - eye[0], at[1] - eye[1], at[2] - eye[2]]
      eye[1] -= step
      at[1] -= step
      break;
    case 87: // w forward
      forward = [at[0] - eye[0], at[1] - eye[1], at[2] - eye[2]]
      forwardVec = new Vector3(forward);
      forwardVec.normalize();

      eye[0] += forwardVec.elements[0] * (deltaTime/30)
      eye[1] += forwardVec.elements[1] * (deltaTime/30)
      eye[2] += forwardVec.elements[2] * (deltaTime/30)

      // update lookAt point
      at[0] += forwardVec.elements[0] * (deltaTime/30)
      at[1] += forwardVec.elements[1] * (deltaTime/30)
      at[2] += forwardVec.elements[2] * (deltaTime/30)
      break;
    case 83: // s backward
      forward = [at[0] - eye[0], at[1] - eye[1], at[2] - eye[2]]
      forwardVec = new Vector3(forward);
      forwardVec.normalize();

      eye[0] -= forwardVec.elements[0] * (deltaTime/30)
      eye[1] -= forwardVec.elements[1] * (deltaTime/30)
      eye[2] -= forwardVec.elements[2] * (deltaTime/30)

      // update lookAt point
      at[0] -= forwardVec.elements[0] * (deltaTime/30)
      at[1] -= forwardVec.elements[1] * (deltaTime/30)
      at[2] -= forwardVec.elements[2] * (deltaTime/30)
      break;
    case 37: // left arrow key
      forward = [at[0] - eye[0], at[1] - eye[1], at[2] - eye[2]]
      forwardVec = new Vector3(forward);
      forwardVec.normalize();
      
      // ROtates the forward vector by 5 degrees
      var rotation = new Matrix4()
      rotation.setRotate(5, up[0], up[1], up[2])
      var rotForward = rotation.multiplyVector3(forwardVec)

      at[0] = rotForward.elements[0] + eye[0];
      at[1] = rotForward.elements[1] + eye[1];
      at[2] = rotForward.elements[2] + eye[2];
      break;
    case 39: // right arrow key
      forward = [at[0] - eye[0], at[1] - eye[1], at[2] - eye[2]]
      forwardVec = new Vector3(forward);
      forwardVec.normalize();
      
      // Rotates the forward vector by 5 degrees
      var rotation = new Matrix4()
      rotation.setRotate(-5, up[0], up[1], up[2])
      var rotForward = rotation.multiplyVector3(forwardVec)

      at[0] = rotForward.elements[0] + eye[0];
      at[1] = rotForward.elements[1] + eye[1];
      at[2] = rotForward.elements[2] + eye[2];
      break;
    default: return; // Skip drawing at no effective action
  }

  draw(gl, n, modelMatrix, u_ModelMatrix);
}

// generate 2d array 32 x 32
// Choose random 0 or 1: Math.floor(Math.random() * 2)
var worldArray = []
var tempArr
function generateWorld(){

	for(var i = 0; i < 32; i++){
		tempArr = []
		for(var j = 0; j < 32; j++){
			// if on an an odd row
			if(i%2 != 0){
				tempArr.push(1)
			}
			// if on an even row
			else{
				// 0 or 1
				var rand = Math.floor(Math.random() * 3)

				if (rand == 0){ // 2
					tempArr.push(2)
				}
				else if (rand == 1){ // 3
					tempArr.push(3)
				}
				else{
					tempArr.push(1)
				}
			}
		}
		worldArray.push(tempArr)
	}
	console.log(worldArray)
}

function crossProduct(direction, up) {
	var product = [0, 0, 0]

	product[0] = ((direction[1] * up[2]) - (direction[2] * up[1]))

	product[1] = -((direction[0] * up[2]) - (direction[2] * up[0]))

	product[2] = ((direction[0] * up[1]) - (direction[1] * up[0]))

	return product
}

// Coded after reviewing https://learnopengl.com/Getting-started/Camera
var firstMovement = true
var lastX = 0, lastY = 0
var posX = 0, posY = 0
var yaw = -90, pitch = 0
function dragMove(ev) {

	if(firstMovement){
		console.log('yes')
		lastX = ev.clientX
		lastY = ev.clientY
		firstMovement = false
	}

	posX = ev.clientX
	posY = ev.clientY

	var offsetX = posX - lastX
	var offsetY = lastY - posY

	lastX = posX
	lastY = posY

	// control movement (not as fast)
	offsetY = offsetY / 2
	offsetX = offsetX / 2

	yaw += offsetX
	pitch += offsetY

	if(pitch > 89.0)
    	pitch = 89.0;
    if(pitch < -89.0)
    	pitch = -89.0;

	var direction = new Vector3(0, 0, 0);
	direction[0] = Math.cos(degToRad(yaw)) * Math.cos(degToRad(pitch))
	direction[1] = Math.sin(degToRad(pitch))
	direction[2] = Math.sin(degToRad(yaw)) * Math.cos(degToRad(pitch))
	direction.normalize()

	at[0] = eye[0] + direction[0]
	at[1] = eye[1] + direction[1]
	at[2] = eye[2] + direction[2]

	draw(gl, n, modelMatrix, u_ModelMatrix);
}

var dToR = Math.PI / 180
function degToRad(deg){
	var val = deg*dToR
	return val
}