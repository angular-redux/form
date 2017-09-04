import {
  Directive,
  Input,
  OnInit,
  Self,
} from "@angular/core";
import {
  FormArrayName,
  FormBuilder,
  FormControl,
  FormGroup,
} from "@angular/forms";

@Directive({
  selector: '[formArrayName][connectArrayFactory]'
})
export class ConnectArrayFactory implements OnInit {

  @Input('connectArrayFactory') private readonly factory: (fb: FormBuilder) => FormGroup | FormControl;

  constructor(@Self() private formArrayName: FormArrayName,
              private fb: FormBuilder) {
  }

  ngOnInit(): void {
    const formArray = this.formArrayName.control;
    const original = formArray.setValue;
    formArray.setValue = (value: any[], config: any): void => {
      if (formArray.controls.length < value.length) {
        for (let i = formArray.controls.length; i < value.length; i++) {
          formArray.push(this.factory(this.fb));
        }
      } else if (formArray.controls.length > value.length) {
        for (let i = value.length; i < formArray.controls.length; i--) {
          formArray.removeAt(i);
        }
      }
      original.bind(formArray)(value, config);
    }
  }
}
