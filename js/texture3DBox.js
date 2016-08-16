(function() {
	'use strict'

	var gl;

	CAPS.Texture3DBox = function ( _gl ) {

		gl = _gl;

	};

	CAPS.Texture3DBox.prototype = {

		constructor: CAPS.Texture3DBox,

		// setHighlight: function ( b ) {
		// 	this.line.material = b ? CAPS.MATERIAL.BoxWireActive : CAPS.MATERIAL.BoxWireframe;
		// }
		vertexShaderCode: '#version 300 es\n\
			precision highp float;\n\
			precision highp int;\n\
			\n\
			uniform mat4 modelViewMatrix;\n\
			uniform mat4 projectionMatrix;\n\
			\n\
			layout(location = 0) in vec3 position;\n\
			\n\
			out vec3 v_texcoord;\n\
			\n\
			void main() {\n\
				\
				//v_pixelNormal = normal;\n\
				//vec4 pos = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\
				vec4 pos = vec4(position, 1.0);\n\
				v_texcoord = pos.xyz;\n\
				gl_Position = pos;\n\
				\
			}\n',

		fragmentShaderCode: '#version 300 es\n\
			precision highp float;\n\
			precision highp int;\n\
			precision highp sampler3D;\n\
			\
			uniform sampler3D diffuse;\n\
			\
			//in vec3 v_pixelNormal;\n\
			in vec3 v_texcoord;\n\
			\
			out vec4 color;\n\
			\
			void main() {\n\
				\n\
				//float shade = (\n\
				//	3.0 * pow ( abs ( v_pixelNormal.y ), 2.0 )\n\
				//	+ 2.0 * pow ( abs ( v_pixelNormal.z ), 2.0 )\n\
				//	+ 1.0 * pow ( abs ( v_pixelNormal.x ), 2.0 )\n\
				//) / 3.0;\n\
				\n\
				//color = texture(diffuse, v_texcoord);\n\
				color = vec4(1.0, 0.0, 0.0, 1.0);\n\
				\
			}\n',


		setup: function (vertices, faces) {

			// init program
			var program = this.program = createProgram(gl, this.vertexShaderCode, this.fragmentShaderCode);

			this.uniformModelViewMatrixLocation = gl.getUniformLocation(program, 'modelViewMatrix');
			this.uniformProjectionMatrixLocation = gl.getUniformLocation(program, 'projectionMatrix');
			this.uniformDiffuseLocation = gl.getUniformLocation(program, 'diffuse');

			// init buffer

			var positions = this.position = [];
			// var positions = this.position = [
			// 	1.0, 1.0, 1.0,
			// 	1.0, -1.0, 1.0,
			// 	-1.0, 1.0, 1.0,
			// 	-1.0, -1.0, 1.0,
			// 	1.0, 1.0, -1.0,
			// 	1.0, -1.0, -1.0,
			// 	-1.0, 1.0, -1.0,
			// 	-1.0, -1.0, -1.0,
			// ];

			for (var i = 0; i < vertices.length; i++) {
				positions.push(vertices[i].x);
				positions.push(vertices[i].y);
				positions.push(vertices[i].z);
			}

			var vertexPosBuffer = this.vertexPosBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
			//gl.bindBuffer(gl.ARRAY_BUFFER, null);

			// Element buffer
			var indexBuffer = this.indexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

			var vertexIndices = this.vertexIndices = [];

			for (var i = 0; i < faces.length; i++) {
				vertexIndices.push(faces[i].a);
				vertexIndices.push(faces[i].b);
				vertexIndices.push(faces[i].c);
			}

			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);



			// create Texture3D

			var SIZE = 32;
			var data = new Uint8Array(SIZE * SIZE * SIZE);
			for (var k = 0; k < SIZE; ++k) {
				for (var j = 0; j < SIZE; ++j) {
					for (var i = 0; i < SIZE; ++i) {
						data[i + j * SIZE + k * SIZE * SIZE] = snoise([i, j, k]) * 256;
					}
				}
			}

			var texture = this.texture = gl.createTexture();
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_3D, texture);
			gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_BASE_LEVEL, 0);
			gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAX_LEVEL, Math.log2(SIZE));
			gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
			gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.REPEAT);
			gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.REPEAT);
			gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.REPEAT);

			gl.texImage3D(
				gl.TEXTURE_3D,  // target
				0,              // level
				gl.R8,        // internalformat
				SIZE,           // width
				SIZE,           // height
				SIZE,           // depth
				0,              // border
				gl.RED,         // format
				gl.UNSIGNED_BYTE,       // type
				data            // pixel
				);

			gl.generateMipmap(gl.TEXTURE_3D);


			// Vertex Array

			var vertexArray = this.vertexArray = gl.createVertexArray();
			gl.bindVertexArray(vertexArray);

			var vertexPosLocation = 0; // set with GLSL layout qualifier
			gl.enableVertexAttribArray(vertexPosLocation);
			gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
			gl.vertexAttribPointer(vertexPosLocation, 3, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, null);

			// var vertexNormalLocation = 1; // set with GLSL layout qualifier
			// gl.enableVertexAttribArray(vertexNormalLocation);
			// gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexBuffer);
			// gl.vertexAttribPointer(vertexTexLocation, 3, gl.FLOAT, false, 0, 0);
			// gl.bindBuffer(gl.ARRAY_BUFFER, null);

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

			gl.bindVertexArray(null);

		},

		drawTexture3DBox: function (MV, P) {
			// Clear color buffer
            // gl.clearColor(0.0, 0.0, 0.5, 1.0);
            // gl.clear(gl.COLOR_BUFFER_BIT);
			gl.clearDepth(1.0);
            gl.clear(gl.DEPTH_BUFFER_BIT);

            // Bind program
            gl.useProgram(this.program);

            gl.uniform1i(this.uniformDiffuseLocation, 0);
            gl.uniformMatrix4fv(this.uniformModelViewMatrixLocation, false, MV);
            gl.uniformMatrix4fv(this.uniformProjectionMatrixLocation, false, P);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_3D, this.texture);

            gl.bindVertexArray(this.vertexArray);


			// var vertexPosLocation = 0; // set with GLSL layout qualifier
			// gl.enableVertexAttribArray(vertexPosLocation);
			// gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPosBuffer);
			// gl.vertexAttribPointer(vertexPosLocation, 3, gl.FLOAT, false, 0, 0);

			 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

			
			if (this.vertexIndices) {
				gl.drawElements(gl.TRIANGLE, this.vertexIndices.length, gl.UNSIGNED_SHORT, 0);
				//gl.drawArrays(gl.TRIANGLE, 0 , 6);
			}
			
		}



	};


	function createShader(gl, source, type) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return shader;
    }

	function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
        var program = gl.createProgram();
        var vshader = createShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
        var fshader = createShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
        gl.attachShader(program, vshader);
        gl.deleteShader(vshader);
        gl.attachShader(program, fshader);
        gl.deleteShader(fshader);
        gl.linkProgram(program);

        var log = gl.getProgramInfoLog(program);
        if (log) {
            console.log(log);
        }

        log = gl.getShaderInfoLog(vshader);
        if (log) {
            console.log(log);
        }

        log = gl.getShaderInfoLog(fshader);
        if (log) {
            console.log(log);
        }

        return program;
    };




})();
