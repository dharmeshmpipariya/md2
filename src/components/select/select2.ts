import {AfterContentInit, Component, ContentChildren, EventEmitter, HostBinding, Input, OnInit, Optional, Output, Provider, QueryList, ViewEncapsulation, forwardRef} from '@angular/core';
import {NG_VALUE_ACCESSOR, ControlValueAccessor} from '@angular/common';
import {Md2SelectDispatcher} from './select_dispatcher';

const MD2_SELECT_CONTROL_VALUE_ACCESSOR = new Provider(
  NG_VALUE_ACCESSOR, {
    useExisting: forwardRef(() => Md2Select),
    multi: true
  });

var _uniqueIdCounter = 0;

export class Md2OptionChange {
  source: Md2Option;
  value: any;
}

@Component({
  selector: 'md2-select',
  template: `
    <div class="md2-select-container">
      <span *ngIf="selectedValue.length < 1" class="md2-select-placeholder">Placeholder</span>
      <span *ngIf="selectedValue.length > 0" class="md2-select-value" [innerHtml]="selectedValue"></span>
      <i class="md2-select-icon"></i>
    </div>
    <div class="md2-select-menu">
      <ng-content></ng-content>    
    </div>
  `,
  styles: [`
    md2-select { position: relative; display: block; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; }
    md2-select:focus { outline: none; }
    md2-select .md2-select-container { display: flex; width: 100%; align-items: center; padding: 2px 0 1px; border-bottom: 1px solid rgba(0, 0, 0, 0.38); position: relative; -moz-box-sizing: content-box; -webkit-box-sizing: content-box; box-sizing: content-box; min-width: 64px; min-height: 26px; flex-grow: 1; cursor: pointer; }
    md2-select:focus .md2-select-container { padding-bottom: 0; border-bottom: 2px solid #106cc8; }
    md2-select.md2-select-disabled .md2-select-container { color: rgba(0,0,0,0.38); }
    md2-select.md2-select-disabled:focus .md2-select-container { padding-bottom: 1px; border-bottom: 1px solid rgba(0, 0, 0, 0.38); }
    md2-select .md2-select-container > span:not(.md2-select-icon) { max-width: 100%; -ms-flex: 1 1 auto; -webkit-flex: 1 1 auto; flex: 1 1 auto; -ms-text-overflow: ellipsis; -o-text-overflow: ellipsis; text-overflow: ellipsis; overflow: hidden; }
    md2-select .md2-select-container .md2-select-icon { display: block; -webkit-align-items: flex-end; -ms-flex-align: end; align-items: flex-end; text-align: end; width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid rgba(0, 0, 0, 0.60); margin: 0 4px; }
    md2-select .md2-select-container .md2-select-placeholder { color: rgba(0, 0, 0, 0.38); }
    md2-select .md2-select-container .md2-select-value { white-space: nowrap; }
    md2-select .md2-select-menu { position: absolute; left: 0; top: 100%; display: block; z-index: 10; -ms-flex-direction: column; -webkit-flex-direction: column; flex-direction: column; width: 100%; margin: 0; padding: 8px 0; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 1px 0 rgba(0, 0, 0, 0.14), 0 2px 1px -1px rgba(0, 0, 0, 0.12); max-height: 256px; min-height: 48px; overflow-y: auto; -moz-transform: scale(1); -ms-transform: scale(1); -o-transform: scale(1); -webkit-transform: scale(1); transform: scale(1); background: #fff; }
  `],
  host: {
    'role': 'select',
    '[id]': 'id',
    '[tabindex]': 'disabled ? -1 : tabindex',
    '[attr.aria-disabled]': 'disabled'
  },
  providers: [MD2_SELECT_CONTROL_VALUE_ACCESSOR],
  encapsulation: ViewEncapsulation.None
})
export class Md2Select implements AfterContentInit, ControlValueAccessor {

  private _value: any = null;
  private _name: string = 'md2-select-' + _uniqueIdCounter++;
  private _disabled: boolean = false;
  private _selected: Md2Option = null;
  private _isInitialized: boolean = false;

  private selectedValue: string = '';

  private _controlValueAccessorChangeFn: (value: any) => void = (value) => { };
  onTouched: () => any = () => { };

  @Output() change: EventEmitter<Md2OptionChange> = new EventEmitter<Md2OptionChange>();

  @ContentChildren(forwardRef(() => Md2Option))
  private _options: QueryList<Md2Option> = null;

  @Input() get name(): string { return this._name; }
  set name(value: string) {
    this._name = value;
    this._updateOptions();
  }

  @Input() tabindex: number = 0;


  @HostBinding('class.md2-select-disabled')
  @Input() get disabled(): boolean { return this._disabled; }
  set disabled(value) {
    this._disabled = (value != null && value !== false) ? true : null;
  }

  @Input() get value(): any { return this._value; }
  set value(newValue: any) {
    if (this._value != newValue) {
      this._value = newValue;
      this._updateSelecteOptionValue();
      if (this._isInitialized) {
        this._emitChangeEvent();
      }
    }
  }

  @Input() get selected() { return this._selected; }
  set selected(selected: Md2Option) {
    this._selected = selected;
    this.value = selected ? selected.value : null;
    if (selected && !selected.selected) {
      selected.selected = true;
      this.selectedValue = document.getElementById(selected.id).innerHTML;
    }
  }

  ngAfterContentInit() {
    this._isInitialized = true;
  }

  touch() {
    if (this.onTouched) {
      this.onTouched();
    }
  }

  private _updateOptions(): void {
    (this._options || []).forEach(option => {
      option.name = this.name;
    });
  }

  private _updateSelecteOptionValue(): void {
    let isAlreadySelected = this._selected != null && this._selected.value == this._value;

    if (this._options != null && !isAlreadySelected) {
      let matchingOption = this._options.filter(option => option.value == this._value)[0];

      if (matchingOption) {
        this.selected = matchingOption;
      } else if (this.value == null) {
        this.selected = null;
        this._options.forEach(option => { option.selected = false; });
      }
    }
  }

  private _emitChangeEvent(): void {
    let event = new Md2OptionChange();
    event.source = this._selected;
    event.value = this._value;
    this._controlValueAccessorChangeFn(event.value);
    this.change.emit(event);
  }

  writeValue(value: any) {
    this.value = value;
  }

  registerOnChange(fn: (value: any) => void) {
    this._controlValueAccessorChangeFn = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }
}


@Component({
  selector: 'md2-option',
  template: '<div class="md2-option-text"><ng-content></ng-content></div>',
  styles: [`
    md2-option { cursor: pointer; position: relative; display: block; align-items: center; width: auto; -moz-transition: background 0.15s linear; -o-transition: background 0.15s linear; -webkit-transition: background 0.15s linear; transition: background 0.15s linear; padding: 0 16px; height: 48px; line-height: 48px; }
    md2-option.md2-option-selected { color: #106cc8; }
    md2-option:hover, md2-option.md2-option-focused { background: #eeeeee; }
    md2-option.md2-option-disabled, md2-option.md2-option-disabled:hover { color: rgba(189,189,189,0.87); cursor: default; background: transparent; }
    md2-option .md2-option-text { width: auto; white-space: nowrap; overflow: hidden; -ms-text-overflow: ellipsis; -o-text-overflow: ellipsis; text-overflow: ellipsis; font-size: 16px; }
  `],
  host: {
    'role': 'select-option',
    '(click)': 'onClick($event)'
  },
  encapsulation: ViewEncapsulation.None
})
export class Md2Option implements OnInit {
  @HostBinding('class.md2-option-focused') private _isFocused: boolean;

  private _selected: boolean = false;

  @HostBinding('id') @Input() id: string = `md2-option-${_uniqueIdCounter++}`;

  @Input() name: string;

  private _disabled: boolean;
  private _value: any = null;

  select: Md2Select;

  @Output() change: EventEmitter<Md2OptionChange> = new EventEmitter<Md2OptionChange>();

  constructor( @Optional() select: Md2Select, public selectDispatcher: Md2SelectDispatcher) {
    this.select = select;
    selectDispatcher.listen((id: string, name: string) => {
      if (id != this.id && name == this.name) {
        this.selected = false;
      }
    });
  }

  @HostBinding('class.md2-option-selected') @Input() get selected(): boolean { return this._selected; }
  set selected(newSelectedState: boolean) {
    if (newSelectedState) {
      this.selectDispatcher.notify(this.id, this.name);
    }

    if (newSelectedState != this._selected) {
      this._emitChangeEvent();
    }

    this._selected = newSelectedState;

    if (newSelectedState && this.select && this.select.value != this.value) {
      this.select.selected = this;
    }
  }

  @Input() get value(): any { return this._value; }
  set value(value: any) {
    if (this._value != value) {
      if (this.select != null && this.selected) {
        this.select.value = value;
      }
      this._value = value;
    }
  }

  @HostBinding('class.md2-option-disabled')
  @Input() get disabled(): boolean {
    return this._disabled || (this.select != null && this.select.disabled);
  }

  set disabled(value: boolean) {
    this._disabled = (value != null && value !== false) ? true : null;
  }

  ngOnInit() {
    if (this.select) {
      this.selected = this.select.value === this._value;
      this.name = this.select.name;
    }
  }

  private _emitChangeEvent(): void {
    let event = new Md2OptionChange();
    event.source = this;
    event.value = this._value;
    this.change.emit(event);
  }

  onClick(event: Event) {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (this.select != null) {
      this.select.selected = this;
      this.select.touch();
    } else {
      this.selected = true;
    }
  }

  onInputFocus() {
    this._isFocused = true;
  }

  onInputBlur() {
    this._isFocused = false;
    if (this.select) {
      this.select.touch();
    }
  }

  onInputChange(event: Event) {
    event.stopPropagation();

    this.selected = true;
    if (this.select) {
      this.select.touch();
    }
  }
}

export {Md2SelectDispatcher} from './select_dispatcher';
export const SELECT_DIRECTIVES = [Md2Select, Md2Option];