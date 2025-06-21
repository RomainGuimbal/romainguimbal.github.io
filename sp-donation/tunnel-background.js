const canvas = document.getElementById('shaderCanvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
            alert('WebGL is not supported in your browser');
        }

        // Vertex shader source
        const vertexShaderSource = `
            attribute vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;

        // Fragment shader source (converted from your Shadertoy shader)
        const fragmentShaderSource = `
            precision lowp float;
            uniform vec2 iResolution;
            uniform float iTime;
            
            void main() {
                vec2 fragCoord = gl_FragCoord.xy;
                vec4 fragColor;
                
                vec2 uv = (fragCoord-.5*iResolution.xy)/iResolution.y;
                float t = iTime*.1;
                
                // Camera
                vec3 ro = vec3(1.05,0,0.0); // ray origin
                vec3 lookat = vec3(0.5,0,1.0);
                float zoom = .8;
               
                vec3 up_changes = vec3(cos(t*.1),sin(t*.1),0.0);
               
                vec3 f = normalize(lookat - ro); //forward
                vec3 r = normalize(cross(up_changes, f)); // right
                vec3 u = cross(f,r); // up
                vec3 c = ro + f * zoom; //center of screen
                vec3 i = c + uv.x * r + uv.y * u;
                vec3 rd = normalize(i-ro);
                
                // Ray marcher
                float dS, dO; // distance to surface, step forward
                vec3 p;
               
                float radius_major = 1.0;
                float radius_minor = .07;
               
                for(int i=0; i<70; i++) {
                    p = ro + rd * dO;
                    dS = -(length(vec2(length(p.xz)- radius_major, p.y)) - radius_minor);
                    if(dS<.0001) break; // ray touched surface
                    dO += dS;
                }
               
                float base_coat = 0.0;
                vec3 highlights = vec3(0.0);
                vec3 col = vec3(0.0);
               
                if(dS<.0001){
                    float x = atan(p.x, p.z); // -pi to pi
                    float y = atan(length(p.xz)- 1.0, p.y);
                   
                    float x_noisy = x + sin(y*20.0)*.01 + sin(y*50.5)*.01;
                    float y_bands = smoothstep(0.1,1.0,sin(-y*250.0));
                    float x_bands = sin(x_noisy*20.0 + -t*12.0) * 5.0;
                   
                    base_coat += (1.2 - smoothstep(-5.0,-3.0, x_bands)+ 0.5)*y_bands*0.8;
                    highlights += (sin(y*5. - t*2.1 - x*5.)*0.5 + 0.5) + (sin(y*1. + t*3.5 - x*5.)*0.5 + 0.5);    
                    highlights = (1. - x_bands)*y_bands*3.*smoothstep(0.2,3., highlights)*.05;
                }
               
                base_coat = mix(base_coat, 0.0, 0.6)+.05;
               
                col = vec3(base_coat*0.5, base_coat*0.6, base_coat) + highlights;
                
                gl_FragColor = vec4(col,1.0);
            }
        `;

        // Compile shader
        function createShader(gl, type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error('Error compiling shader:', gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            
            return shader;
        }

        // Create program
        function createProgram(gl, vertexShader, fragmentShader) {
            const program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.error('Error linking program:', gl.getProgramInfoLog(program));
                gl.deleteProgram(program);
                return null;
            }
            
            return program;
        }

        // Initialize WebGL
        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        const program = createProgram(gl, vertexShader, fragmentShader);

        // Set up geometry (full-screen quad)
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1,
        ]), gl.STATIC_DRAW);

        // Get attribute and uniform locations
        const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
        const resolutionUniformLocation = gl.getUniformLocation(program, 'iResolution');
        const timeUniformLocation = gl.getUniformLocation(program, 'iTime');

        // Animation variables
        let startTime = Date.now();
        let isAnimating = true;
        let accumulatedTime = 0;
        let lastFrameTime = Date.now();
        let timeMultiplier = 1.0;

        // Get center button element
        const centerButton = document.getElementById('centerButton');

        // Resize canvas
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
        }

        // Render function
        function render() {
            if (!isAnimating) return;
            
            resizeCanvas();
            
            // Clear canvas
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            
            // Use shader program
            gl.useProgram(program);
            
            // Set up position attribute
            gl.enableVertexAttribArray(positionAttributeLocation);
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
            
            // Calculate time accumulation properly
            const currentFrameTime = Date.now();
            const deltaTime = (currentFrameTime - lastFrameTime) / 1000.0;
            accumulatedTime += deltaTime * timeMultiplier;
            lastFrameTime = currentFrameTime;
            
            // Set uniforms
            gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
            gl.uniform1f(timeUniformLocation, accumulatedTime);
            
            // Draw
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            
            requestAnimationFrame(render);
        }

        // Calculate distance from mouse to center button
        function getDistanceToCenter(mouseX, mouseY) {
            const rect = canvas.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            return Math.sqrt(Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2));
        }

        // Update time multiplier based on mouse distance
        function updateTimeMultiplier(distance) {
            const maxDistance = 600; // Maximum distance for effect
            const maxMultiplier = 25.0; // Maximum time acceleration
            
            if (distance <= maxDistance) {
                // Closer to center = higher multiplier (inverse relationship)
                const normalizedDistance = distance / maxDistance;
                timeMultiplier = 1.0 + (maxMultiplier - 1.0) * (1.0 - normalizedDistance)**2;
                
                // // Visual feedback on center button
                // const scale = 1.0 + (1.0 - normalizedDistance) * 0.4;
                // const glowIntensity = (1.0 - normalizedDistance) * 1.0;
                
                
                centerButton.style.transform = `translate(-50%, -50%)`;
                
                // -webkit-filter: drop-shadow( 0px 0px 20px rgba(255, 255, 255, 0.7));
                // centerButton.style.dropShadow = `0 0 ${20 + glowIntensity * 80}px rgba(255, 255, 255, ${glowIntensity})`;
    
                // centerButton.style.boxShadow = `0 0 ${20 + glowIntensity * 80}px rgba(255, 255, 255, ${glowIntensity})`;
            } else {
                timeMultiplier = 1.0;
                centerButton.style.transform = 'translate(-50%, -50%) scale(1.0)';
                // centerButton.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.1)';

            }
        }

        // Control functions
        function resetTime() {
            accumulatedTime = 0;
            lastFrameTime = Date.now();
        }

        // Event listeners
        window.addEventListener('resize', resizeCanvas);
        
        // Mouse movement tracking for time acceleration
        document.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const distance = getDistanceToCenter(mouseX, mouseY);
            updateTimeMultiplier(distance);
        });
        
        // Touch movement tracking for time acceleration on mobile
        document.addEventListener('touchmove', (e) => {
            if (e.touches && e.touches.length > 0) {
                const rect = canvas.getBoundingClientRect();
                const touch = e.touches[0];
                const touchX = touch.clientX - rect.left;
                const touchY = touch.clientY - rect.top;
                const distance = getDistanceToCenter(touchX, touchY);
                updateTimeMultiplier(distance);
            }
        }, { passive: true });
        
        // Reset time multiplier when mouse leaves canvas
        document.addEventListener('mouseleave', () => {
            timeMultiplier = 1.0;
            centerButton.style.transform = 'translate(-50%, -50%) scale(1.0)';
            centerButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            centerButton.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            centerButton.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.1)';
        });

        // Start the animation
        resizeCanvas();
        render();