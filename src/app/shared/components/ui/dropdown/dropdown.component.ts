import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, OnDestroy, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-dropdown',
  templateUrl: './dropdown.component.html',
  imports:[CommonModule]
})
export class DropdownComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Input() className = '';

  @ViewChild('dropdownRef') dropdownRef!: ElementRef<HTMLDivElement>;
  private isListenerActive = false;
  private activationTimeout: any;

  constructor(private cdr: ChangeDetectorRef) {}

  private handleClickOutside = (event: MouseEvent) => {
    if (
      this.isOpen &&
      this.isListenerActive &&
      this.dropdownRef &&
      this.dropdownRef.nativeElement &&
      !this.dropdownRef.nativeElement.contains(event.target as Node) &&
      !(event.target as HTMLElement).closest('.dropdown-toggle')
    ) {
      this.close.emit();
    }
  };

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen']) {
      if (this.isOpen) {
        // Activar el listener después de un pequeño delay para evitar que capture el clic que abrió el dropdown
        this.isListenerActive = false;
        clearTimeout(this.activationTimeout);
        this.activationTimeout = setTimeout(() => {
          this.isListenerActive = true;
        }, 100);
      } else {
        this.isListenerActive = false;
        clearTimeout(this.activationTimeout);
      }
    }
  }

  ngAfterViewInit() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  ngOnDestroy() {
    document.removeEventListener('mousedown', this.handleClickOutside);
    clearTimeout(this.activationTimeout);
  }
}