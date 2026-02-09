import { App } from './App';

/**
 * UIController: Manages HTML/CSS interface.
 * (Steps 26, 27, 28, 29)
 */
export class UIController {
    breadcrumbElement: HTMLElement | null = null;
    leftMenu: HTMLElement | null = null;
    rightMenu: HTMLElement | null = null;
    minimapCanvas: HTMLCanvasElement | null = null;

    constructor(app: App) {
        this.app = app;
        this.initOverlay();
    }

    private initOverlay(): void {
        const uiLayer = document.getElementById('ui-layer') || document.body;
        
        // Breadcrumbs
        this.breadcrumbElement = document.createElement('div');
        this.breadcrumbElement.className = 'breadcrumb';
        this.breadcrumbElement.style.position = 'absolute';
        this.breadcrumbElement.style.top = '20px';
        this.breadcrumbElement.style.left = '20px';
        this.breadcrumbElement.style.color = 'white';
        this.breadcrumbElement.style.fontSize = '18px';
        this.breadcrumbElement.style.fontFamily = 'Inter, sans-serif';
        this.breadcrumbElement.innerText = 'Root';
        uiLayer.appendChild(this.breadcrumbElement);

        // Minimap
        this.minimapCanvas = document.createElement('canvas');
        this.minimapCanvas.className = 'minimap';
        this.minimapCanvas.width = 150;
        this.minimapCanvas.height = 150;
        this.minimapCanvas.style.position = 'absolute';
        this.minimapCanvas.style.top = '20px';
        this.minimapCanvas.style.right = '20px';
        this.minimapCanvas.style.background = 'rgba(0, 0, 0, 0.5)';
        this.minimapCanvas.style.border = '1px solid #00ffff';
        uiLayer.appendChild(this.minimapCanvas);

        // Thumb Buttons
        this.leftMenu = this.createThumbMenu('left', ['Add Node', 'Clear']);
        this.rightMenu = this.createThumbMenu('right', ['Reset Cam', 'Help']);
        
        uiLayer.appendChild(this.leftMenu);
        uiLayer.appendChild(this.rightMenu);
    }

    private createThumbMenu(side: 'left' | 'right', items: string[]): HTMLElement {
        const wrapper = document.createElement('div');
        wrapper.className = `thumb-button-wrapper ${side}`;
        wrapper.style.position = 'absolute';
        wrapper.style.bottom = '20px';
        wrapper.style[side] = '40px';
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column-reverse';
        wrapper.style.alignItems = 'center';
        wrapper.style.pointerEvents = 'auto';

        const button = document.createElement('div');
        button.className = 'thumb-button';
        button.innerText = side.toUpperCase();
        button.style.width = '80px';
        button.style.height = '80px';
        button.style.background = 'rgba(0, 255, 255, 0.2)';
        button.style.border = '2px solid #00ffff';
        button.style.color = 'white';
        button.style.display = 'flex';
        button.style.justifyContent = 'center';
        button.style.alignItems = 'center';
        button.style.borderRadius = '50%';
        button.style.cursor = 'pointer';
        button.style.fontWeight = 'bold';

        const subMenu = document.createElement('div');
        subMenu.className = 'sub-menu';
        subMenu.style.display = 'none';
        subMenu.style.flexDirection = 'column-reverse';
        subMenu.style.gap = '10px';
        subMenu.style.marginBottom = '15px';

        items.forEach(text => {
            const subBtn = document.createElement('div');
            subBtn.className = 'sub-button';
            subBtn.innerText = text;
            subBtn.style.width = '70px';
            subBtn.style.height = '70px';
            subBtn.style.background = 'rgba(0, 0, 0, 0.6)';
            subBtn.style.border = '1px solid #00ffff';
            subBtn.style.color = 'white';
            subBtn.style.borderRadius = '50%';
            subBtn.style.display = 'flex';
            subBtn.style.justifyContent = 'center';
            subBtn.style.alignItems = 'center';
            subBtn.style.fontSize = '10px';
            subBtn.style.textAlign = 'center';
            subMenu.appendChild(subBtn);
        });

        button.addEventListener('click', () => {
            const isVisible = subMenu.style.display === 'flex';
            subMenu.style.display = isVisible ? 'none' : 'flex';
            button.style.background = isVisible ? 'rgba(0, 255, 255, 0.2)' : 'rgba(0, 255, 255, 0.5)';
        });

        wrapper.appendChild(button);
        wrapper.appendChild(subMenu);
        return wrapper;
    }

    updateMinimap(): void {
        if (!this.minimapCanvas) return;
        const ctx = this.minimapCanvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, 150, 150);
        ctx.fillStyle = '#00ffff';
        
        // Simple visualization of root plane nodes
        this.app.rootPlane.nodes.forEach(node => {
            const x = 75 + node.mesh.position.x * 2;
            const y = 75 + node.mesh.position.z * 2;
            ctx.fillRect(x - 2, y - 2, 4, 4);
        });
    }

    updateBreadcrumbs(): void {
        if (!this.breadcrumbElement) return;
        const path = this.app.navigator.path;
        this.breadcrumbElement.innerText = ['Root', ...path].join(' > ');
    }

    toggleMenu(side: 'left' | 'right'): void { }
}
