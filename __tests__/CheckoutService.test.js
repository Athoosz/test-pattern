import { UserMother } from './builders/UserMother.js';

describe('UserMother', () => {
    test('cria um usuario padrao', () => {
        const usuario = UserMother.umUsuarioPadrao();

        expect(usuario.tipo).toBe('PADRAO');
        expect(usuario.isPremium()).toBe(false);
    });

    test('cria um usuario premium', () => {
        const usuario = UserMother.umUsuarioPremium();

        expect(usuario.tipo).toBe('PREMIUM');
        expect(usuario.isPremium()).toBe(true);
    });
});
