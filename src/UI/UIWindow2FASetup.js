/*
    Plan:
        Components: OneAtATimeView < ... >

        Screen 1: QR code and entry box for testing
            Components: Flexer < QRCodeView, CodeEntryView, ActionsView >
            Logic:
            - when CodeEntryView has a value, check it against the QR code value...
              ... then go to the next screen
              - CodeEntryView will have callbacks: `verify`, `on_verified`
            - cancel action

        Screen 2: Recovery codes
            Components: Flexer < RecoveryCodesView, ConfirmationsView, ActionsView >
            Logic:
            - done action
            - cancel action
            - when done action is clicked, call /auth/configure-2fa/enable

*/

import TeePromise from "../util/TeePromise.js";
import ValueHolder from "../util/ValueHolder.js";
import Button from "./Components/Button.js";
import CodeEntryView from "./Components/CodeEntryView.js";
import ConfirmationsView from "./Components/ConfirmationsView.js";
import Flexer from "./Components/Flexer.js";
import QRCodeView from "./Components/QRCode.js";
import RecoveryCodesView from "./Components/RecoveryCodesView.js";
import StepHeading from "./Components/StepHeading.js";
import StepView from "./Components/StepView.js";
import StringView from "./Components/StringView.js";
import TestView from "./Components/TestView.js";
import UIAlert from "./UIAlert.js";
import UIComponentWindow from "./UIComponentWindow.js";

const UIWindow2FASetup = async function UIWindow2FASetup () {
    // FIRST REQUEST :: Generate the QR code and recovery codes
    const resp = await fetch(`${api_origin}/auth/configure-2fa/setup`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${puter.authToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
    });
    const data = await resp.json();

    // SECOND REQUEST :: Verify the code [first wizard screen]
    const check_code_ = async function check_code_ (value) {
        const resp = await fetch(`${api_origin}/auth/configure-2fa/test`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${puter.authToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: value,
            }),
        });

        const data = await resp.json();

        return data.ok;
    };

    // FINAL REQUEST :: Enable 2FA [second wizard screen]
    const enable_2fa_ = async function check_code_ (value) {
        const resp = await fetch(`${api_origin}/auth/configure-2fa/enable`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${puter.authToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });

        const data = await resp.json();

        return data.ok;
    };

    let stepper;
    let code_entry;
    let win;
    let done_enabled = new ValueHolder(false);

    const promise = new TeePromise();

    const component =
        new StepView({
            _ref: me => stepper = me,
            children: [
                new Flexer({
                    children: [
                        new StepHeading({
                            symbol: '1',
                            text: i18n('setup2fa_1_step_heading'),
                        }),
                        new StringView({
                            text: i18n('setup2fa_1_instructions', [], false),
                            no_html_encode: true,
                        }),
                        new StepHeading({
                            symbol: '2',
                            text: i18n('setup2fa_2_step_heading')
                        }),
                        new QRCodeView({
                            value: data.url,
                        }),
                        new StepHeading({
                            symbol: '3',
                            text: i18n('setup2fa_3_step_heading')
                        }),
                        new CodeEntryView({
                            _ref: me => code_entry = me,
                            async [`property.value`] (value, { component }) {
                                console.log('value? ', value)

                                if ( ! await check_code_(value) ) {
                                    component.set('error', 'Invalid code');
                                    component.set('is_checking_code', false);
                                    return;
                                }
                                component.set('is_checking_code', false);

                                stepper.next();
                            }
                        }),
                    ],
                    ['event.focus'] () {
                        code_entry.focus();
                    }
                }),
                new Flexer({
                    children: [
                        new StepHeading({
                            symbol: '4',
                            text: i18n('setup2fa_4_step_heading')
                        }),
                        new StringView({
                            text: i18n('setup2fa_4_instructions', [], false)
                        }),
                        new RecoveryCodesView({
                            values: data.codes,
                        }),
                        new StepHeading({
                            symbol: '5',
                            text: i18n('setup2fa_5_step_heading')
                        }),
                        new ConfirmationsView({
                            confirmations: [
                                i18n('setup2fa_5_confirmation_1'),
                                i18n('setup2fa_5_confirmation_2'),
                            ],
                            confirmed: done_enabled,
                        }),
                        new Button({
                            enabled: done_enabled,
                            label: i18n('setup2fa_5_button'),
                            on_click: async () => {
                                await enable_2fa_();
                                stepper.next();
                            },
                        }),
                    ]
                }),
            ]
        })
        ;

    stepper.values_['done'].sub(value => {
        if ( ! value ) return;
        $(win).close();
        console.log('WE GOT HERE')
        promise.resolve(true);
    })

    win = await UIComponentWindow({
        component,
        on_before_exit: async () => {
            if ( ! stepper.get('done') ) {
                promise.resolve(false);
            }
            return true
        },

        title: '2FA Setup',
        app: 'instant-login',
        single_instance: true,
        icon: null,
        uid: null,
        is_dir: false,
        // has_head: false,
        selectable_body: true,
        // selectable_body: false,
        allow_context_menu: false,
        is_resizable: false,
        is_droppable: false,
        init_center: true,
        allow_native_ctxmenu: false,
        allow_user_select: true,
        // backdrop: true,
        width: 550,
        height: 'auto',
        dominant: true,
        show_in_taskbar: false,
        draggable_body: false,
        center: true,
        onAppend: function(this_window){
        },
        window_class: 'window-qr',
        body_css: {
            width: 'initial',
            height: '100%',
            'background-color': 'rgb(245 247 249)',
            'backdrop-filter': 'blur(3px)',
            padding: '20px',
        },
    });

    return { promise };
}

export default UIWindow2FASetup;