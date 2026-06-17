describe('Testando a Cobertura do Front-end', () => {
  it('Deve carregar a página de login com sucesso', () => {
    cy.visit('http://localhost:3000/login');
    cy.contains('button', /entrar/i).should('be.visible');
  });
});