export function fadeIn(element, duration = 300) {
    if (!element) return Promise.resolve();
    
    element.style.opacity = '0';
    element.style.display = '';
    
    return new Promise(resolve => {
        const start = performance.now();
        
        function animate(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = String(progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                resolve();
            }
        }
        
        requestAnimationFrame(animate);
    });
}

export function fadeOut(element, duration = 300) {
    if (!element) return Promise.resolve();
    
    return new Promise(resolve => {
        const start = performance.now();
        const initialOpacity = parseFloat(getComputedStyle(element).opacity) || 1;
        
        function animate(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = String(initialOpacity * (1 - progress));
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
                resolve();
            }
        }
        
        requestAnimationFrame(animate);
    });
}

export function slideIn(element, direction = 'up', duration = 300) {
    if (!element) return Promise.resolve();
    
    const transforms = {
        up: 'translateY(20px)',
        down: 'translateY(-20px)',
        left: 'translateX(20px)',
        right: 'translateX(-20px)'
    };
    
    element.style.opacity = '0';
    element.style.transform = transforms[direction] || transforms.up;
    element.style.display = '';
    
    return new Promise(resolve => {
        const start = performance.now();
        
        function animate(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            
            element.style.opacity = String(eased);
            element.style.transform = `translate${direction === 'up' || direction === 'down' ? 'Y' : 'X'}(${20 * (1 - eased) * (direction === 'up' || direction === 'left' ? 1 : -1)}px)`;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.transform = '';
                resolve();
            }
        }
        
        requestAnimationFrame(animate);
    });
}

export function staggeredFadeIn(elements, delay = 100, duration = 300) {
    const promises = Array.from(elements).map((el, index) => {
        return new Promise(resolve => {
            setTimeout(() => {
                fadeIn(el, duration).then(resolve);
            }, index * delay);
        });
    });
    
    return Promise.all(promises);
}

export default {
    fadeIn,
    fadeOut,
    slideIn,
    staggeredFadeIn
};
